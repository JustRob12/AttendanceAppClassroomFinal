import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import axiosInstance from '../config/axios';
import LoadingScreen from './LoadingScreen';
import { AntDesign } from '@expo/vector-icons';

type RootStackParamList = {
  SignIn: undefined;
  Register: undefined;
  TeacherDash: undefined;
  StudentDash: undefined;
  AdminTabs: undefined;
};

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

const SignIn: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsReady(true), 100);
  }, []);

  if (!isReady) {
    return <LoadingScreen message="Preparing..." />;
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      try {
        // Try admin login first
        const adminResponse = await axiosInstance.post('/api/admins/login', formData);
        if (adminResponse.data && adminResponse.data.token) {
          await AsyncStorage.setItem('token', adminResponse.data.token);
          navigation.navigate('AdminTabs');
          return;
        }
      } catch (error: any) {
        // If it's a network error, throw it to the outer catch block
        if (error.message === 'Network Error') {
          throw error;
        }
        // If admin login fails, try teacher login
        try {
          const teacherResponse = await axiosInstance.post('/api/teachers/login', formData);
          if (teacherResponse.data && teacherResponse.data.token) {
            await AsyncStorage.setItem('token', teacherResponse.data.token);
            navigation.navigate('TeacherDash');
            return;
          }
        } catch (error: any) {
          // If it's a network error, throw it to the outer catch block
          if (error.message === 'Network Error') {
            throw error;
          }
          // If teacher login fails, try student login
          try {
            const studentResponse = await axiosInstance.post('/api/students/login', formData);
            if (studentResponse.data && studentResponse.data.token) {
              await AsyncStorage.setItem('token', studentResponse.data.token);
              navigation.navigate('StudentDash');
              return;
            }
          } catch (studentError: any) {
            // If it's a network error, throw it to the outer catch block
            if (studentError.message === 'Network Error') {
              throw studentError;
            }
            // Only show error if all login attempts fail
            Alert.alert(
              'Error',
              'Invalid credentials. Please check your email and password.'
            );
          }
        }
      }
    } catch (err: any) {
      // Handle unexpected errors (network issues, etc.)
      console.error('Unexpected login error:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Signing in..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>AttScan</Text>
          <Text style={styles.subtitle}>Tap, scan, you're all set – AttScan won't let you forget!</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(text: string) => setFormData({ ...formData, email: text })}
              />
              <AntDesign name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text: string) => setFormData({ ...formData, password: text })}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.inputIcon}
              >
                <AntDesign 
                  name={showPassword ? "eye" : "eyeo"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleSubmit}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => {/* Handle forgot password */}}
          >
            {/* <Text style={styles.forgotPasswordText}>Forgot Password?</Text> */}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    paddingLeft: 48,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignIn; 