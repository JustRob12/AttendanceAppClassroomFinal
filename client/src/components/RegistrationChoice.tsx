import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

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

const RegistrationChoice: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Registration Type</Text>
      
      <TouchableOpacity 
        style={[styles.choiceButton, styles.teacherButton]}
        onPress={() => navigation.navigate('TeacherRegister')}
      >
        <Text style={styles.buttonText}>Register as Teacher</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.choiceButton, styles.studentButton]}
        onPress={() => navigation.navigate('StudentRegister')}
      >
        <Text style={styles.buttonText}>Register as Student</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  choiceButton: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  teacherButton: {
    backgroundColor: '#4F46E5',
  },
  studentButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegistrationChoice; 