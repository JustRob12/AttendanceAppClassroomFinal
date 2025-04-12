import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { withExpoSnack } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';

import { styled } from "nativewind";

// Import your components
import SignIn from './src/components/SignIn';
import Register from './src/components/Register';
import TeacherDash from './src/components/TeacherDash';
import StudentDash from './src/components/StudentDash';
import AdminTabs from './src/navigation/AdminTabs';
import AdminReport from './src/components/AdminReport';
import ProfileAdmin from './src/components/ProfileAdmin';
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
  Register: undefined;
  TeacherDash: undefined;
  StudentDash: undefined;
  AdminTabs: undefined;
  AdminReport: undefined;
  ProfileAdmin: undefined;
  AttendanceClass: { classData: ClassData };
};

const Stack = createStackNavigator<RootStackParamList>();
const StyledView = styled(View);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setTimeout(() => setIsReady(true), 500);
    }
  };

  return (
    <SafeAreaProvider>
      <StyledView className="flex-1 bg-white">
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
              name="Register" 
              component={Register}
              options={{
                title: 'Register',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="TeacherDash" 
              component={TeacherDash}
              options={{
                title: 'Teacher Dashboard',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="StudentDash" 
              component={StudentDash}
              options={{
                title: 'Student Dashboard',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="AdminTabs" 
              component={AdminTabs}
              options={{
                title: 'Admin Dashboard',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="AdminReport" 
              component={AdminReport}
              options={{
                title: 'Admin Report',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="ProfileAdmin" 
              component={ProfileAdmin}
              options={{
                title: 'Admin Profile',
                headerShown: false
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
      </StyledView>
    </SafeAreaProvider>
  );
};

export default withExpoSnack(App);
