import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();

    useEffect(() => {
    console.log('Index page - Current user:', user);
    console.log('User type:', typeof user);
    console.log('User role:', user?.prefs?.role);
    console.log('User object keys:', user ? Object.keys(user) : 'null');
    
    // Add a small delay to ensure auth context is properly initialized
    const timer = setTimeout(() => {
      if (user && user.prefs?.role) {
        console.log('User found, role:', user.prefs.role);
        try {
          if (user.prefs.role === 'student') {
            console.log('Redirecting to student dashboard');
            router.push('/(tabs)');
          } else {
            console.log('Unknown role:', user.prefs.role);
            router.push('/auth/login');
          }
        } catch (error) {
          console.error('Navigation error:', error);
        }
      } else {
        console.log('No user found or no role, redirecting to login');
        console.log('User object:', user);
        try {
          router.push('/auth/login');
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
});