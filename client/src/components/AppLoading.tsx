import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { styled } from "nativewind";

const StyledView = styled(View);

const AppLoading = () => {
  return (
    <StyledView className="flex-1 bg-gray-900 justify-center items-center">
      <ActivityIndicator size="large" color="white" />
    </StyledView>
  );
};

export default AppLoading; 