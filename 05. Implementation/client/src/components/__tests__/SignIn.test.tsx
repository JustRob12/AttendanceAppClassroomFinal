import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignIn from '../SignIn';
import axiosInstance from '../../config/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Test Suite for SignIn Component
 * 
 * Verifies the authentication process for all user types:
 * - Admin login
 * - Teacher login
 * - Student login
 * - Error handling for invalid credentials
 * - Loading states
 * - Navigation after successful login
 * 
 * Tests both successful and failed login attempts for each user type
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

// Mock axios
jest.mock('../../config/axios', () => ({
  post: jest.fn(),
}));

// Mock Alert
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  reactNative.Alert = {
    alert: jest.fn(),
  };
  return reactNative;
});

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Suppress console errors
console.error = jest.fn();

describe('SignIn Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignIn />);
    
    // Wait for LoadingScreen to disappear
    await waitFor(() => {
      expect(getByText('AttScan')).toBeTruthy();
    });
    
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('handles successful admin login', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
      data: { token: 'admin-token' },
    });

    const { getByPlaceholderText, getByText } = render(<SignIn />);
    
    // Wait for loading to disappear
    await waitFor(() => {
      expect(getByText('AttScan')).toBeTruthy();
    });
    
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'admin@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'admin-token');
      expect(mockNavigate).toHaveBeenCalledWith('AdminTabs');
    });
  });

  it('handles successful teacher login', async () => {
    (axiosInstance.post as jest.Mock)
      .mockRejectedValueOnce(new Error('Admin login failed'))
      .mockResolvedValueOnce({
        data: { token: 'teacher-token' },
      });

    const { getByPlaceholderText, getByText } = render(<SignIn />);
    
    // Wait for loading to disappear
    await waitFor(() => {
      expect(getByText('AttScan')).toBeTruthy();
    });
    
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'teacher@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'teacher-token');
      expect(mockNavigate).toHaveBeenCalledWith('TeacherDash');
    });
  });

  it('handles successful student login', async () => {
    (axiosInstance.post as jest.Mock)
      .mockRejectedValueOnce(new Error('Admin login failed'))
      .mockRejectedValueOnce(new Error('Teacher login failed'))
      .mockResolvedValueOnce({
        data: { token: 'student-token' },
      });

    const { getByPlaceholderText, getByText } = render(<SignIn />);
    
    // Wait for loading to disappear
    await waitFor(() => {
      expect(getByText('AttScan')).toBeTruthy();
    });
    
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'student@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'student-token');
      expect(mockNavigate).toHaveBeenCalledWith('StudentDash');
    });
  });

  it('shows error alert when all login attempts fail', async () => {
    (axiosInstance.post as jest.Mock)
      .mockRejectedValueOnce(new Error('Admin login failed'))
      .mockRejectedValueOnce(new Error('Teacher login failed'))
      .mockRejectedValueOnce(new Error('Student login failed'));

    const { getByPlaceholderText, getByText } = render(<SignIn />);
    
    // Wait for loading to disappear
    await waitFor(() => {
      expect(getByText('AttScan')).toBeTruthy();
    });
    
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrongpassword');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Invalid credentials. Please check your email and password.'
      );
    });
  });

  it('shows unexpected error alert when a network error occurs', async () => {
    const networkError = new Error('Network Error');
    (axiosInstance.post as jest.Mock).mockImplementation(() => {
      throw networkError;
    });

    const { getByPlaceholderText, getByText } = render(<SignIn />);
    
    // Wait for loading to disappear
    await waitFor(() => {
      expect(getByText('AttScan')).toBeTruthy();
    });
    
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
    });
  });
}); 