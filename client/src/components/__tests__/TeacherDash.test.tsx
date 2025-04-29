import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TeacherDash from '../TeacherDash';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, Text } from 'react-native';

/**
 * Test Suite for TeacherDash Component
 * 
 * Tests the teacher dashboard functionality:
 * - Profile information display
 * - Class list management
 * - Loading states
 * - Sign out process
 * - Navigation to attendance taking
 * - Class data display
 * 
 * Uses mock data for teacher profile, classes, and statistics
 */

// Mock dependencies
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://test-image.jpg' }]
  }),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

// Simplified mock for the tab navigator
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const View = require('react-native').View;
  return {
    createBottomTabNavigator: () => {
      return {
        Navigator: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
        Screen: ({ children }: { children: React.ReactNode | (() => React.ReactNode) }) => {
          if (typeof children === 'function') {
            return children();
          }
          return children;
        }
      };
    }
  };
});

// Mock Alert
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  reactNative.Alert = {
    alert: jest.fn((title, message, buttons) => {
      // Simulate pressing the last button (usually the confirmation button)
      if (buttons && buttons.length) {
        const lastButton = buttons[buttons.length - 1];
        if (lastButton.onPress) lastButton.onPress();
      }
    }),
  };
  return reactNative;
});

// Suppress console errors
console.error = jest.fn();

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn()
};

// Sample data for tests
const mockTeacherData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '123-456-7890',
};

const mockClasses = [
  {
    id: 1,
    subjectCode: 'CS101',
    subjectDescription: 'Introduction to Computer Science',
    schedule: 'MWF 10:00-11:30',
  }
];

const mockStats = {
  totalClasses: 1,
  totalStudents: 15,
  averageAttendance: 92
};

describe('TeacherDash Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful responses
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/profile')) {
        return Promise.resolve({ data: mockTeacherData });
      } else if (url.includes('/classes')) {
        return Promise.resolve({ data: mockClasses });
      } else if (url.includes('/stats')) {
        return Promise.resolve({ data: mockStats });
      } else if (url.includes('/total-students')) {
        return Promise.resolve({ data: { totalStudents: 15 } });
      } else if (url.includes('/average-attendance')) {
        return Promise.resolve({ data: { averageAttendance: 92 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
  });

  it('renders loading state correctly', async () => {
    const { getByText } = render(<TeacherDash navigation={mockNavigation as any} />);
    
    expect(getByText('Loading your profile...')).toBeTruthy();
  });

  it('displays teacher data after loading', async () => {
    const { queryByText, findByText, getAllByText } = render(<TeacherDash navigation={mockNavigation as any} />);
    
    await waitFor(() => {
      // Wait for loading to disappear
      expect(queryByText('Loading your profile...')).toBeNull();
    });
    
    // Check for contact info
    expect(await findByText('john.doe@example.com')).toBeTruthy();
    expect(await findByText('123-456-7890')).toBeTruthy();
    
    // Check for faculty member title
    expect(await findByText('Faculty Member')).toBeTruthy();
  });

  it('handles sign out correctly', async () => {
    const { queryByText, findByText } = render(<TeacherDash navigation={mockNavigation as any} />);
    
    await waitFor(() => {
      // Wait for loading to disappear
      expect(queryByText('Loading your profile...')).toBeNull();
    });
    
    // Find and click the Sign Out button
    const signOutButton = await findByText('Sign Out');
    fireEvent.press(signOutButton);
    
    // Wait for AsyncStorage to be called and navigation to be triggered
    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockNavigate).toHaveBeenCalledWith('SignIn');
    });
  });

  it('displays class data correctly', async () => {
    const { queryByText, findByText } = render(<TeacherDash navigation={mockNavigation as any} />);
    
    await waitFor(() => {
      // Wait for loading to disappear
      expect(queryByText('Loading your profile...')).toBeNull();
    });
    
    // Verify class data is displayed
    expect(await findByText('CS101')).toBeTruthy();
    expect(await findByText('Introduction to Computer Science')).toBeTruthy();
    expect(await findByText('MWF 10:00-11:30')).toBeTruthy();
  });
  
  it('navigates to class attendance view correctly', async () => {
    const { queryByText, findByText } = render(<TeacherDash navigation={mockNavigation as any} />);
    
    await waitFor(() => {
      // Wait for loading to disappear
      expect(queryByText('Loading your profile...')).toBeNull();
    });
    
    // Find and press the Take Attendance button
    const attendanceButton = await findByText('Take Attendance');
    fireEvent.press(attendanceButton);
    
    // Check that navigation was called with the correct parameters
    expect(mockNavigate).toHaveBeenCalledWith('AttendanceClass', {
      classData: expect.objectContaining({
        id: 1,
        subjectCode: 'CS101'
      })
    });
  });
}); 