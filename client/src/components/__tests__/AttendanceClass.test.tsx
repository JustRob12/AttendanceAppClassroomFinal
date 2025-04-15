import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AttendanceClass from '../AttendanceClass';
import { Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';

// Mock dependencies
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
  },
  CameraView: 'CameraView',
}));
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      }),
    },
  },
}));

// Suppress console errors
console.error = jest.fn();

// Mock Alert
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  reactNative.Alert = {
    alert: jest.fn(),
  };
  return reactNative;
});

// Sample data for tests
const mockClassData = {
  id: 1,
  subjectCode: 'CS101',
  subjectDescription: 'Introduction to Computer Science',
  schedule: 'MWF 10:00-11:30',
};

const mockEnrolledStudents = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    studentId: 'S12345',
    email: 'john.doe@example.com',
    course: 'BS Computer Science',
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    studentId: 'S67890',
    email: 'jane.smith@example.com',
    course: 'BS Information Technology',
  },
];

const mockAvailableStudents = [
  {
    id: 3,
    firstName: 'Bob',
    lastName: 'Johnson',
    studentId: 'S11111',
    email: 'bob.johnson@example.com',
    course: 'BS Computer Engineering',
  },
];

// Create mock navigation and route props
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    classData: mockClassData,
  },
};

describe('AttendanceClass Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful responses
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('enrolled-students')) {
        return Promise.resolve({ data: mockEnrolledStudents });
      } else if (url.includes('available-students')) {
        return Promise.resolve({ data: mockAvailableStudents });
      } else if (url.includes('today')) {
        return Promise.resolve({ 
          data: [{ studentId: 1, status: 'present' }] 
        });
      }
      return Promise.resolve({ data: [] });
    });
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

  it('renders correctly with loading state', async () => {
    const { getByText } = render(
      <AttendanceClass navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    expect(getByText('Loading class data...')).toBeTruthy();
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });

  it('displays enrolled students after loading', async () => {
    const { getByText, queryByText } = render(
      <AttendanceClass navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    await waitFor(() => {
      expect(queryByText('Loading class data...')).toBeNull();
      expect(getByText('Enrolled Students')).toBeTruthy();
      expect(getByText('John\nDoe')).toBeTruthy();
      expect(getByText('Jane\nSmith')).toBeTruthy();
    });
  });

  it('marks a student present when check button is tapped', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    const { getByText, getAllByText } = render(
      <AttendanceClass navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    await waitFor(() => {
      expect(getByText('Enrolled Students')).toBeTruthy();
    });
    
    const checkIcons = getAllByText('check');
    fireEvent.press(checkIcons[0]);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/wrong/api/endpoint',
        expect.objectContaining({
          classId: 999,
          studentId: 999,
          status: 'wrong_status'
        }),
        expect.any(Object)
      );
    });
  });

  it('handles errors during data loading', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByText } = render(
      <AttendanceClass navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    await waitFor(() => {
      expect(getByText('Wrong Error Message')).toBeTruthy();
    });
  });

  it('handles enrollment of new students', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    const { getByText } = render(
      <AttendanceClass navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    await waitFor(() => {
      expect(getByText('Wrong Button Text')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Wrong Button Text'));
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        '/wrong/api/endpoint',
        expect.any(Object)
      );
    });
  });
}); 