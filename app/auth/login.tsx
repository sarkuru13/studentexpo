import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, authLoading, user } = useAuth();

  // Monitor user changes and redirect
  useEffect(() => {
    if (user && user.prefs.role) {
      console.log('Login screen - User detected, redirecting based on role:', user.prefs.role);
      if (user.prefs.role === 'student') {
        router.replace('/(tabs)');
      }
    }
  }, [user]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      console.log('Attempting login with:', email, password);
      await login(email.trim(), password.trim());
      console.log('Login successful - user should be set in context');
      console.log('Login function completed, checking if navigation happens...');
      // Navigation will be handled by the useEffect based on user role
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.title}>Welcome Back</Text>
                  <Text style={styles.subtitle}>Sign in to your account</Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Mail color="#94a3b8" size={Math.max(18, width * 0.045)} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                      />
                    </View>
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Lock color="#94a3b8" size={Math.max(18, width * 0.045)} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Password"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                        activeOpacity={0.7}
                      >
                        {showPassword ? (
                          <EyeOff color="#94a3b8" size={Math.max(18, width * 0.045)} />
                        ) : (
                          <Eye color="#94a3b8" size={Math.max(18, width * 0.045)} />
                        )}
                      </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.loginButton, authLoading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={authLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginButtonText}>
                      {authLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  <Link href="/auth/forgot-password" asChild>
                    <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                      <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Math.max(20, width * 0.05),
    paddingVertical: Math.max(20, height * 0.025),
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: Math.max(40, height * 0.05),
  },
  header: {
    alignItems: 'center',
    marginBottom: Math.max(30, height * 0.04),
  },
  title: {
    fontSize: Math.max(28, width * 0.07),
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: Math.max(6, height * 0.008),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.max(14, width * 0.035),
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: Math.max(20, width * 0.05),
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: Math.max(16, height * 0.02),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: Math.max(12, width * 0.03),
  },
  inputIcon: {
    marginRight: Math.max(10, width * 0.025),
  },
  input: {
    flex: 1,
    fontSize: Math.max(14, width * 0.035),
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    paddingVertical: Math.max(12, height * 0.015),
  },
  passwordInput: {
    marginRight: Math.max(8, width * 0.02),
  },
  eyeIcon: {
    padding: Math.max(8, width * 0.02),
  },
  errorText: {
    fontSize: Math.max(11, width * 0.028),
    fontFamily: 'Inter-Regular',
    color: '#ef4444',
    marginTop: Math.max(4, height * 0.005),
    marginLeft: Math.max(4, width * 0.01),
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: Math.max(14, height * 0.018),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Math.max(16, height * 0.02),
  },
  loginButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  loginButtonText: {
    fontSize: Math.max(16, width * 0.04),
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: Math.max(8, height * 0.01),
  },
  forgotPasswordText: {
    fontSize: Math.max(14, width * 0.035),
    fontFamily: 'Inter-Regular',
    color: '#3b82f6',
  },
});