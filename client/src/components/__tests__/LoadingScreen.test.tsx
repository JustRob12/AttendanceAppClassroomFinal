import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingScreen from '../LoadingScreen';

describe('LoadingScreen Component', () => {
  it('renders correctly with default message', () => {
    const { getByText } = render(<LoadingScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders correctly with custom message', () => {
    const { getByText } = render(<LoadingScreen message="Custom Loading Message" />);
    expect(getByText('Custom Loading Message')).toBeTruthy();
  });

  it('displays the loading indicator', () => {
    const { getByTestId } = render(<LoadingScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
}); 