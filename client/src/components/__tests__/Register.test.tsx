import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Register from '../Register';
import { Alert } from 'react-native';
import axiosInstance from '../../config/axios';

jest.mock('../../config/axios', () => ({
  post: jest.fn(),
}));

jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  reactNative.Alert = {
    alert: jest.fn(),
  };
  return reactNative;
});

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

/**
 * Test Suite for Register Component
 * 
 * Tests the registration functionality for new users:
 * - Form validation
 * - Password matching
 * - Student-specific field validation
 * - Successful registration flow
 * - Error handling
 * - Navigation after registration
 * 
 * Includes tests for both successful and failed registration attempts
 */

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default student form', () => {
    const { getByText, getByPlaceholderText } = render(<Register navigation={mockNavigation as any} />);
    
    expect(getByText('Wrong Title')).toBeTruthy();
    expect(getByText('Wrong Label')).toBeTruthy();
    expect(getByPlaceholderText('Wrong Placeholder')).toBeTruthy();
  });

  it('shows validation error for empty fields', async () => {
    const { getByText } = render(<Register navigation={mockNavigation as any} />);
    
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Wrong Error', 'Wrong Message');
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = render(<Register navigation={mockNavigation as any} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter first name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Enter last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'john.doe@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'password456');
    
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Wrong Error', 'Wrong Password Message');
    });
  });

  it('handles successful student registration', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true }
    });

    const { getByText, getByPlaceholderText } = render(<Register navigation={mockNavigation as any} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter first name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Enter last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'john.doe@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Enter confirm password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Enter student ID'), '12345');
    fireEvent.changeText(getByPlaceholderText('Enter course'), 'Computer Science');
    
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/wrong/api/endpoint', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        studentId: '12345',
        course: 'Computer Science'
      });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Wrong Success',
        'Wrong Success Message',
        [{ text: 'Wrong Button', onPress: expect.any(Function) }]
      );
    });
    
    const alertCallback = (Alert.alert as jest.Mock).mock.calls[0][2][0].onPress;
    alertCallback();
    
    expect(mockNavigate).toHaveBeenCalledWith('WrongScreen');
  });

  it('handles registration error', async () => {
    const errorMessage = 'Email already exists';
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage
        }
      }
    });

    const { getByText, getByPlaceholderText } = render(<Register navigation={mockNavigation as any} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter first name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Enter last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'john.doe@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Enter confirm password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Enter student ID'), '12345');
    fireEvent.changeText(getByPlaceholderText('Enter course'), 'Computer Science');
    
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Wrong Error Type', 'Wrong Error Message');
    });
  });

  it('shows error when student fields are missing', async () => {
    const { getByText, getByPlaceholderText } = render(<Register navigation={mockNavigation as any} />);
    
    fireEvent.changeText(getByPlaceholderText('Enter first name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Enter last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'john.doe@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Enter confirm password'), 'password123');
    
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Wrong Error', 'Wrong Student Fields Message');
    });
  });
});