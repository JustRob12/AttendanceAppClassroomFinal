import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import env from '../config/env';
import LoadingScreen from './LoadingScreen';

type RootStackParamList = {
  SignIn: undefined;
  Register: undefined;
  TeacherDash: undefined;
  StudentDash: undefined;
};

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

interface Props {
  navigation: SignInScreenNavigationProp;
}

const SignIn: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsReady(true), 100);
  }, []);

  if (!isReady) {
    return <LoadingScreen message="Preparing..." />;
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      // Try teacher login first
      try {
        const teacherResponse = await axios.post(`${env.apiUrl}/api/teachers/login`, formData);
        if (teacherResponse.data.token) {
          await AsyncStorage.setItem('token', teacherResponse.data.token);
          navigation.navigate('TeacherDash');
          return;
        }
      } catch (error) {
        // If teacher login fails, try student login
        try {
          const studentResponse = await axios.post(`${env.apiUrl}/api/students/login`, formData);
          if (studentResponse.data.token) {
            await AsyncStorage.setItem('token', studentResponse.data.token);
            navigation.navigate('StudentDash');
            return;
          }
        } catch (studentError) {
          throw studentError;
        }
      }
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Signing in..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Log in</Text>
        <Text style={styles.subtitle}>Login to start using attendance</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text: string) => setFormData({ ...formData, email: text })}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          secureTextEntry
          value={formData.password}
          onChangeText={(text: string) => setFormData({ ...formData, password: text })}
        />

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleSubmit}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    padding: 8,
  },
  registerText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  registerLink: {
    color: '#000',
    fontWeight: '600',
  },
});

export default SignIn; 