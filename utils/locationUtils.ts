import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  name: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if user is within the allowed radius of the attendance location
 * @param userLocation User's current location
 * @param attendanceLocation Expected attendance location
 * @returns boolean indicating if user is within range
 */
export const isWithinAttendanceRange = (
  userLocation: LocationData,
  attendanceLocation: AttendanceLocation
): boolean => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    attendanceLocation.latitude,
    attendanceLocation.longitude
  );

  return distance <= attendanceLocation.radius;
};

/**
 * Get current location with error handling
 * @returns Promise<LocationData | null>
 */
export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Request location permission
 * @returns Promise<Location.PermissionStatus>
 */
export const requestLocationPermission = async (): Promise<Location.PermissionStatus> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return Location.PermissionStatus.DENIED;
  }
};

/**
 * Check if location services are enabled
 * @returns Promise<boolean>
 */
export const isLocationEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

/**
 * Format location data for display
 * @param location Location data to format
 * @returns Formatted string
 */
export const formatLocation = (location: LocationData): string => {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
};

/**
 * Validate attendance with location check
 * @param userLocation User's current location
 * @param expectedLocation Expected attendance location
 * @returns Object with validation result and details
 */
export const validateAttendanceLocation = (
  userLocation: LocationData,
  expectedLocation: AttendanceLocation
) => {
  const isWithinRange = isWithinAttendanceRange(userLocation, expectedLocation);
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    expectedLocation.latitude,
    expectedLocation.longitude
  );

  return {
    isValid: isWithinRange,
    distance: Math.round(distance),
    maxAllowedDistance: expectedLocation.radius,
    locationName: expectedLocation.name,
  };
}; 