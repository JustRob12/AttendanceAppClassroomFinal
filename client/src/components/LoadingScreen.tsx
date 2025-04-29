import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <StyledView className="flex-1 bg-white justify-center items-center" testID="loading-screen">
      <ActivityIndicator size="large" color="#111827" testID="loading-indicator" />
      <StyledText className="text-gray-600 mt-4">{message}</StyledText>
    </StyledView>
  );
};

export default LoadingScreen; 