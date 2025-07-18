import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, FlipHorizontal, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { 
  getCurrentLocation, 
  requestLocationPermission, 
  formatLocation,
  validateAttendanceLocation,
  type LocationData 
} from '../../utils/locationUtils';
import { findAttendanceLocation } from '../../data/attendanceLocations';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Scanner() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [scanned, setScanned] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [locationLogs, setLocationLogs] = useState<string[]>([]);
  const [showLocationLogs, setShowLocationLogs] = useState(false);
  
  const { user } = useAuth();
  const { markPresentByQR, studentData } = useData();

  // Request location permission on component mount
  useEffect(() => {
    handleLocationPermission();
  }, []);

  const handleLocationPermission = async () => {
    setIsRequestingPermissions(true);
    const status = await requestLocationPermission();
    setLocationPermission(status);
    
    // If location permission is granted, automatically request camera permission
    if (status === Location.PermissionStatus.GRANTED) {
      addLocationLog('Location permission granted');
      requestPermission();
    }
    setIsRequestingPermissions(false);
  };

  const addLocationLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLocationLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  // Start location monitoring when permissions are granted
  useEffect(() => {
    if (locationPermission === Location.PermissionStatus.GRANTED && permission?.granted) {
      addLocationLog('Starting location monitoring...');
      startLocationMonitoring();
    }
  }, [locationPermission, permission?.granted]);

  const startLocationMonitoring = async () => {
    try {
      // Get initial location
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        addLocationLog(`Location acquired: ${formatLocation(location)}`);
      }

      // Set up location watching
      const locationSubscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 5, // Update if moved 5 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          };
          setCurrentLocation(locationData);
          addLocationLog(`Location updated: ${formatLocation(locationData)} (Accuracy: ${locationData.accuracy?.toFixed(1)}m)`);
        }
      );

      return () => {
        locationSubscription.then(sub => sub.remove());
      };
    } catch (error) {
      addLocationLog(`Location monitoring error: ${error}`);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            We need access to your camera to scan QR codes for attendance marking.
          </Text>
          <TouchableOpacity 
            style={[styles.permissionButton, isRequestingPermissions && styles.permissionButtonDisabled]} 
            onPress={requestPermission}
            disabled={isRequestingPermissions}
          >
            {isRequestingPermissions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.permissionButtonText}>Requesting...</Text>
              </View>
            ) : (
              <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.permissionNote}>
            Location permission has been granted ✓
          </Text>
        </View>
      </View>
    );
  }

  // Check if location permission is denied
  if (locationPermission === Location.PermissionStatus.DENIED) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <MapPin size={48} color="#ffffff" style={styles.permissionIcon} />
          <Text style={styles.permissionTitle}>Location Permission Required</Text>
          <Text style={styles.permissionMessage}>
            We need access to your location to verify your attendance. This helps ensure you are physically present at the class location.
          </Text>
          <TouchableOpacity 
            style={[styles.permissionButton, isRequestingPermissions && styles.permissionButtonDisabled]} 
            onPress={handleLocationPermission}
            disabled={isRequestingPermissions}
          >
            {isRequestingPermissions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.permissionButtonText}>Requesting...</Text>
              </View>
            ) : (
              <Text style={styles.permissionButtonText}>Grant Location Permission</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.permissionNote}>
            Camera permission will be requested next
          </Text>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    setIsLoadingLocation(true);
    
    try {
      // Parse QR data
      const qrData = JSON.parse(data);
      console.log('QR Data parsed:', qrData);
      
      // Check if QR code is expired
      const now = new Date();
      const expiresAt = new Date(qrData.expiresAt);
      if (now > expiresAt) {
        Alert.alert(
          'QR Code Expired',
          'This QR code has expired. Please ask your teacher for a new one.',
          [
            {
              text: 'OK',
              onPress: () => setScanned(false),
            },
          ]
        );
        return;
      }
      
      // Get current location before marking attendance
      const location = await getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        
        // Validate location against QR data
        const qrLocation = {
          latitude: qrData.latitude,
          longitude: qrData.longitude,
          radius: 50, // 50 meters radius
          name: 'Class Location',
        };
        
        const validation = validateAttendanceLocation(location, qrLocation);
        
        if (validation.isValid) {
          // Mark attendance in the system
          const today = new Date().toISOString().split('T')[0];
          if (studentData) {
            markPresentByQR(studentData.$id, today);
          }
          
          Alert.alert(
            'Attendance Marked Successfully! ✅',
            `Course ID: ${qrData.courseId}\nLocation: ${formatLocation(location)}\nDistance from class: ${validation.distance}m (within ${validation.maxAllowedDistance}m radius)`,
            [
              {
                text: 'Scan Another',
                onPress: () => setScanned(false),
              },
              {
                text: 'Done',
                onPress: () => router.push('/(tabs)'),
              },
            ]
          );
        } else {
          Alert.alert(
            'Location Verification Failed ❌',
            `You are too far from the class location.\n\nYour location: ${formatLocation(location)}\nClass location: ${qrLocation.name}\nDistance: ${validation.distance}m (max allowed: ${validation.maxAllowedDistance}m)`,
            [
              {
                text: 'Try Again',
                onPress: () => setScanned(false),
              },
              {
                text: 'Cancel',
                onPress: () => setScanned(false),
                style: 'cancel',
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please ensure location services are enabled.',
          [
            {
              text: 'Try Again',
              onPress: () => setScanned(false),
            },
            {
              text: 'Cancel',
              onPress: () => setScanned(false),
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('QR parsing error:', error);
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not valid. Please scan a valid attendance QR code.',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
        ]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.push('/(tabs)')}
          >
            <X color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.headerButtons}>
            {locationPermission === Location.PermissionStatus.GRANTED && (
              <TouchableOpacity
                style={styles.logsButton}
                onPress={() => setShowLocationLogs(!showLocationLogs)}
              >
                <Text style={styles.logsButtonText}>
                  {showLocationLogs ? 'Hide' : 'Show'} Logs
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <FlipHorizontal color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </View>
        </CameraView>

        <View style={styles.instructions}>
          {isLoadingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : (
            <Text style={styles.instructionText}>
              Position the QR code within the frame to mark your attendance
            </Text>
          )}
          
          {/* Location Logs Display */}
          {locationPermission === Location.PermissionStatus.GRANTED && currentLocation && showLocationLogs && (
            <View style={styles.locationLogsContainer}>
              <Text style={styles.locationLogsTitle}>Location Logs:</Text>
              <View style={styles.locationLogsList}>
                {locationLogs.slice(-5).map((log, index) => (
                  <Text key={index} style={styles.locationLogEntry}>
                    {log}
                  </Text>
                ))}
              </View>
              <Text style={styles.currentLocationText}>
                Current: {formatLocation(currentLocation)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  innerContent: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  flipButton: {
    padding: 8,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: '80%',
    maxWidth: 350,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#ffffff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  permissionIcon: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  permissionButtonDisabled: {
    opacity: 0.6,
  },
  permissionNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  locationLogsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationLogsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 8,
  },
  locationLogsList: {
    marginBottom: 8,
  },
  locationLogEntry: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#cbd5e1',
    marginBottom: 2,
    lineHeight: 16,
  },
  currentLocationText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#10b981',
    marginTop: 4,
  },
  logsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logsButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
});