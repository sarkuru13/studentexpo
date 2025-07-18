import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { databases } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { useRouter } from 'expo-router';

interface StudentData {
  Name?: string;
  ABC_ID?: string;
  Course?: {
    Programme: string;
    Duration: number;
  };
  Batch?: string;
  Year?: string;
  Semester?: string;
  [key: string]: any;
}

export default function Profile() {
  const { user, logout, } = useAuth();
  const router = useRouter();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  const fetchStudentData = useCallback(async () => {
    if (dataFetched || !user?.$id) return;
    
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        '6819e71f002774754561',
        '6819e983001dc900e9f9',
      );
      if (response.total > 0) {
        setStudentData(response.documents[0] as StudentData);
      }
      setDataFetched(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.$id, dataFetched]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: async () => {
        await logout();
        router.push('/auth/login');
      }, style: 'destructive'},
    ]);
  };
  // console.log('Logged in user ID:', authUser?.$id);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadContainer]}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={[styles.container, styles.loadContainer]}>
        <Text style={styles.headerTitle}>No student data found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.avatar}
          />
          <Text style={styles.profileName}>{studentData.Name || 'N/A'}</Text>
          <Text style={styles.profileEmail}>ID: {studentData.ABC_ID || 'N/A'}</Text>
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 30}}>
        <View style={styles.innerContent}>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{user?.email || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Phone Number</Text><Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Course</Text><Text style={styles.infoValue}>{studentData.Course ? `${studentData.Course.Programme} (${studentData.Course.Duration} months)` : 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Batch</Text><Text style={styles.infoValue}>{studentData.Batch || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Year</Text><Text style={styles.infoValue}>{studentData.Year ? `${studentData.Year} Year` : 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Current Semester</Text><Text style={styles.infoValue}>{studentData.Semester || 'N/A'}</Text></View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#ef4444" size={20} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  innerContent: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginRight: 8,
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7d7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#667eea',
  },
});