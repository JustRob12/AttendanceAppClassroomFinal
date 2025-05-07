import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
import env from '../config/env';
import { styled } from "nativewind";

type RootStackParamList = {
  StudentRegister: undefined;
  SignIn: undefined;
};

type StudentRegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StudentRegister'
>;

interface Props {
  navigation: StudentRegisterScreenNavigationProp;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouchable = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const StudentRegister: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    course: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.studentId || 
        !formData.email || !formData.course || !formData.password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${env.apiUrl}/api/students/register`, formData);
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        Alert.alert('Success', 'Registration successful', [
          { text: 'OK', onPress: () => navigation.navigate('SignIn') }
        ]);
      }
    } catch (err: any) {
      console.error('Registration error:', err.response?.data || err.message);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  };

  return (
    <StyledScrollView className="flex-2 bg-white">
      <StyledView className="p-7 top-10">
        <StyledView className="mb-8">
          <StyledText className="text-3xl font-bold text-gray-900 mb-2">
            Sign up
          </StyledText>
          <StyledText className="text-gray-500">
            Register as a student
          </StyledText>
        </StyledView>

        <StyledView className="flex-row space-x-4 mb-6">
          <StyledView className="flex-1">
            <StyledText className="text-sm font-medium text-gray-600 mb-2">First Name w/ M.I.</StyledText>
            <StyledInput
              className="bg-white px-4 py-3 rounded-lg"
              style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            />
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-sm font-medium text-gray-600 mb-2">Last Name</StyledText>
            <StyledInput
              className="bg-white px-4 py-3 rounded-lg"
              style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            />
          </StyledView>
        </StyledView>

        <StyledView className="flex-row space-x-4 mb-6">
          <StyledView className="flex-1">
            <StyledText className="text-sm font-medium text-gray-600 mb-2">Student ID</StyledText>
            <StyledInput
              className="bg-white px-4 py-3 rounded-lg"
              style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              placeholder="Student ID"
              placeholderTextColor="#9CA3AF"
              value={formData.studentId}
              onChangeText={(text) => setFormData({ ...formData, studentId: text })}
            />
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-sm font-medium text-gray-600 mb-2">Course</StyledText>
            <StyledInput
              className="bg-white px-4 py-3 rounded-lg"
              style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              placeholder="Course"
              placeholderTextColor="#9CA3AF"
              value={formData.course}
              onChangeText={(text) => setFormData({ ...formData, course: text })}
            />
          </StyledView>
        </StyledView>

        <StyledText className="text-sm font-medium text-gray-600 mb-2">Email</StyledText>
        <StyledInput
          className="bg-white px-4 py-3 rounded-lg mb-6"
          style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />

        <StyledText className="text-sm font-medium text-gray-600 mb-2">Password</StyledText>
        <StyledInput
          className="bg-white px-4 py-3 rounded-lg mb-6"
          style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
        />

        <StyledText className="text-sm font-medium text-gray-600 mb-2">Confirm Password</StyledText>
        <StyledInput
          className="bg-white px-4 py-3 rounded-lg mb-6"
          style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
          placeholder="Confirm Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
        />

        <StyledTouchable 
          className="bg-gray-900 py-3 rounded-lg mb-4"
          onPress={handleSubmit}
        >
          <StyledText className="text-white text-center font-semibold">Sign up</StyledText>
        </StyledTouchable>

        <StyledTouchable 
          className="mt-4"
          onPress={() => navigation.navigate('SignIn')}
        >
          <StyledText className="text-gray-500 text-center">
            Already have an account? <StyledText className="text-gray-900 font-semibold">Log in</StyledText>
          </StyledText>
        </StyledTouchable>
      </StyledView>
    </StyledScrollView>
  );
};

export default StudentRegister; 