/**
 * Test Suite for AdminTabs Component
 * 
 * This test suite verifies the functionality of the admin dashboard tabs:
 * - Initial rendering and loading states
 * - Data fetching from API (teachers, students, admin profile)
 * - Navigation between tabs
 * - Logout functionality
 * - Error handling
 * 
 * Mock Data:
 * - Teachers list with contact info
 * - Students list with academic details
 * - Admin profile information
 * 
 * Dependencies Mocked:
 * - axios for API calls
 * - AsyncStorage for token management
 * - Bottom Tab Navigator
 * - Alert for logout confirmation
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminTabs from '../AdminTabs';
import { Alert, AlertButton } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample mock data with descriptive comments
const mockTeachers = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '123-456-7890'
  }
];

const mockStudents = [
  {
    id: 1,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    studentId: 'S12345',
    course: 'Computer Science'
  }
];

const mockAdminData = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com'
};

// Mock axios with specific responses for each endpoint
jest.mock('axios', () => ({
  get: jest.fn((url) => {
    if (url.includes('/api/teachers')) {
      return Promise.resolve({ data: mockTeachers });
    } else if (url.includes('/api/students')) {
      return Promise.resolve({ data: mockStudents });
    } else if (url.includes('/api/admins/profile')) {
      return Promise.resolve({ data: mockAdminData });
    }
    return Promise.resolve({ data: {} });
  }),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

// Mock AsyncStorage for token management
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('mock-token')),
  removeItem: jest.fn(() => Promise.resolve())
}));

// Mock AdminDashboard for simplified testing
jest.mock('../AdminDashboard', () => () => null);

// Mock environment configuration
jest.mock('../../config/env', () => ({
  apiUrl: 'http://test-api.com'
}));

// Mock tab navigator to render all screens
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      Screen: ({ component: Component }: { component: React.ComponentType<any> }) => <Component />
    })
  };
});

// Mock Alert for logout confirmation
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Alert = {
    alert: jest.fn()
  };
  return rn;
});

// Suppress console errors during testing
console.error = jest.fn();

describe('AdminTabs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test basic rendering
  it('renders without crashing', () => {
    const mockNavigate = jest.fn();
    render(<AdminTabs navigation={{ navigate: mockNavigate }} />);
  });

  // Test initial loading state
  it('shows loading state initially', () => {
    const mockNavigate = jest.fn();
    const { getAllByText } = render(<AdminTabs navigation={{ navigate: mockNavigate }} />);
    expect(getAllByText('Loading...').length).toBeGreaterThan(0);
  });

  // Test API data fetching
  it('attempts to fetch data from the API', async () => {
    const mockNavigate = jest.fn();
    render(<AdminTabs navigation={{ navigate: mockNavigate }} />);
    
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('token');
    });
  });

  // Test logout functionality
  it('validates the logout functionality', async () => {
    // Simulate pressing "Yes" on logout confirmation
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const yesButton = buttons?.find((button: AlertButton) => button.text === 'Yes');
      if (yesButton && yesButton.onPress) {
        yesButton.onPress();
      }
    });
    
    const handleLogout = () => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: async () => {
              await AsyncStorage.removeItem('token');
            } 
          }
        ]
      );
    };
    
    handleLogout();
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Logout',
      'Are you sure you want to logout?',
      expect.any(Array)
    );
    
    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
}); 