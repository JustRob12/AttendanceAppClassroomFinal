import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import your components
import SignIn from './src/components/SignIn';
import RegistrationChoice from './src/components/RegistrationChoice';
import TeacherRegister from './src/components/Register'; // Renamed from Register to TeacherRegister
import StudentRegister from './src/components/StudentRegister';
import TeacherDash from './src/components/TeacherDash';
import StudentDash from './src/components/StudentDash';
import AttendanceClass from './src/components/AttendanceClass';

// Define interfaces
interface ClassData {
  id: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
}

// Define the type for the stack navigator
export type RootStackParamList = {
  SignIn: undefined;
  RegistrationChoice: undefined;
  TeacherRegister: undefined;
  StudentRegister: undefined;
  TeacherDash: undefined;
  StudentDash: undefined;
  AttendanceClass: { classData: ClassData };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SignIn"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4F46E5',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen 
            name="SignIn" 
            component={SignIn}
            options={{
              title: 'Sign In',
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="RegistrationChoice" 
            component={RegistrationChoice}
            options={{
              title: 'Choose Registration Type',
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="TeacherRegister" 
            component={TeacherRegister}
            options={{
              title: 'Teacher Registration',
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="StudentRegister" 
            component={StudentRegister}
            options={{
              title: 'Student Registration',
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="TeacherDash" 
            component={TeacherDash}
            options={{
              title: 'Teacher Dashboard',
              headerShown: false,
              // Prevent going back to login screen
              headerLeft: () => null,
              gestureEnabled: false
            }}
          />
          <Stack.Screen 
            name="StudentDash" 
            component={StudentDash}
            options={{
              title: 'Student Dashboard',
              headerShown: false,
              headerLeft: () => null,
              gestureEnabled: false
            }}
          />
          <Stack.Screen 
            name="AttendanceClass" 
            component={AttendanceClass}
            options={{
              title: 'Class Attendance',
              headerShown: false
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
