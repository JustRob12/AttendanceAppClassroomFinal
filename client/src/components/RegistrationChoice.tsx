import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { styled } from "nativewind";

type RootStackParamList = {
  RegistrationChoice: undefined;
  TeacherRegister: undefined;
  StudentRegister: undefined;
};

type RegistrationChoiceScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RegistrationChoice'
>;

interface Props {
  navigation: RegistrationChoiceScreenNavigationProp;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchable = styled(TouchableOpacity);

const RegistrationChoice: React.FC<Props> = ({ navigation }) => {
  return (
    <StyledView className="flex-1 p-6 justify-center bg-white">
      <StyledView className="mb-8">
        <StyledText className="text-3xl font-bold text-gray-900 mb-2">
          Sign up
        </StyledText>
        <StyledText className="text-gray-600">
          What are you registering as?
        </StyledText>
      </StyledView>
      
      <StyledTouchable 
        className="bg-gray-900 py-4 rounded-lg mb-4"
        onPress={() => navigation.navigate('TeacherRegister')}
      >
        <StyledText className="text-white text-center font-semibold">Register as Teacher</StyledText>
      </StyledTouchable>

      <StyledTouchable 
        className="bg-gray-700 py-4 rounded-lg"
        onPress={() => navigation.navigate('StudentRegister')}
      >
        <StyledText className="text-white text-center font-semibold">Register as Student</StyledText>
      </StyledTouchable>
    </StyledView>
  );
};

export default RegistrationChoice; 