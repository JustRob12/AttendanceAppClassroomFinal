import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { styled } from "nativewind";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import env from '../config/env';
import Icon from 'react-native-vector-icons/Ionicons';
import Class from './Class';
import LoadingScreen from './LoadingScreen';
import * as ImagePicker from 'expo-image-picker';

type RootStackParamList = {
  TeacherDash: undefined;
  SignIn: undefined;
  AttendanceClass: { classData: ClassData };
};

type TeacherDashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TeacherDash'>;

interface Props {
  navigation: TeacherDashScreenNavigationProp;
}

interface TeacherData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
}

interface ClassData {
  id: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
}

const Tab = createBottomTabNavigator();
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchable = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

// Profile Screen Component
const ProfileScreen = ({ 
  teacherData, 
  handleLogout,
  fetchTeacherData 
}: { 
  teacherData: TeacherData | null, 
  handleLogout: () => Promise<void>,
  fetchTeacherData: () => Promise<void>
}) => {
  const [uploading, setUploading] = useState(false);

  const handleProfilePicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setUploading(true);
        const formData = new FormData();
        formData.append('profilePicture', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile-picture.jpg',
        } as any);

        const token = await AsyncStorage.getItem('token');
        await axios.post(`${env.apiUrl}/api/teachers/profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        // Refresh profile to get new picture
        await fetchTeacherData();
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <StyledView className="flex-1 bg-white p-6">
      <StyledView className="flex-1 top-10">
        <StyledView className="items-center mb-8">
          <StyledTouchable 
            onPress={handleProfilePicture}
            style={{ marginBottom: 16 }}
          >
            {teacherData?.profilePicture ? (
              <Image
                source={{ uri: teacherData.profilePicture }}
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: 64,
                  backgroundColor: '#F3F4F6',
              
                }}
                resizeMode="cover"
              />
            ) : (
              <StyledView className=" w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
                <Icon name="person" size={50} color="#9CA3AF" />
                <StyledText className="text-gray-500 text-xs mt-2">
                  Tap to upload
                </StyledText>
              </StyledView>
            )}
            {uploading && (
              <View 
                style={{
                  position: 'absolute',
                  width: 128,
                  height: 128,
                  borderRadius: 64,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <ActivityIndicator color="white" />
              </View>
            )}
          </StyledTouchable>
          {/* <StyledText className="text-xl font-semibold text-gray-900">
            {teacherData?.firstName} {teacherData?.lastName}
          </StyledText> */}
        </StyledView>

        <StyledView className="bg-gray-50 rounded-xl p-6 mb-6">
          <StyledText className="text-2xl font-bold text-gray-900 mb-6">
            Personal Information
          </StyledText>
          <StyledView className="space-y-4">
            <StyledView>
              <StyledText className="text-sm text-gray-500">Full Name</StyledText>
              <StyledText className="text-lg text-gray-900">{teacherData?.firstName} {teacherData?.lastName}</StyledText>
            </StyledView>
            <StyledView>
              <StyledText className="text-sm text-gray-500">Email</StyledText>
              <StyledText className="text-lg text-gray-900">{teacherData?.email}</StyledText>
            </StyledView>
            <StyledView>
              <StyledText className="text-sm text-gray-500">Phone Number</StyledText>
              <StyledText className="text-lg text-gray-900">{teacherData?.phoneNumber}</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledView>
      
      <StyledTouchable
        className="bg-gray-900 py-4 rounded-lg"
        onPress={handleLogout}
      >
        <StyledText className="text-white text-center font-semibold">Logout</StyledText>
      </StyledTouchable>
    </StyledView>
  );
};

// Classes Screen Component
const ClassesScreen = ({ classes, navigation }: { classes: ClassData[], navigation: any }) => {
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Loading classes..." />;
  }

  return (
    <StyledScrollView className="flex-1 bg-white p-6 top-10">
      <StyledView className="flex-row justify-between items-center mb-6">
        <StyledText className="text-2xl font-bold text-gray-900">
          My Classes
        </StyledText>
        <StyledTouchable 
          className="bg-gray-900 px-4 py-2 rounded-lg"
          onPress={() => setIsClassModalVisible(true)}
        >
          <StyledText className="text-white font-semibold">Add Class</StyledText>
        </StyledTouchable>
      </StyledView>

      {classes.map((classItem) => (
        <StyledTouchable 
          key={classItem.id} 
          className="mb-4 rounded-xl"
          style={{
            borderWidth: 1,
            borderColor: '#F3F4F6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
          onPress={() => navigation.navigate('AttendanceClass', { classData: classItem })}
        >
          <StyledView 
            className="bg-gray-50 p-4"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6'
            }}
          >
            <StyledText className="text-lg font-semibold text-gray-900">
              {classItem.subjectCode}
            </StyledText>
            <StyledView className="flex-row items-center mt-1">
              <Icon name="time-outline" size={16} color="#6B7280" />
              <StyledText className="text-sm text-gray-500 ml-1">
                {classItem.schedule}
              </StyledText>
            </StyledView>
          </StyledView>
          <StyledView className="bg-white p-4">
            <StyledText className="text-base text-gray-600">
              {classItem.subjectDescription}
            </StyledText>
            <StyledView className="mt-4 flex-row justify-end">
              <StyledView className="bg-gray-100 px-3 py-1 rounded-full">
                <StyledText className="text-sm text-gray-600">
                  Take Attendance
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledTouchable>
      ))}

      <Class
        visible={isClassModalVisible}
        onClose={() => setIsClassModalVisible(false)}
        onClassAdded={() => {}}
      />

      {classes.length === 0 && (
        <StyledView className="items-center justify-center py-8">
          <Icon name="book-outline" size={48} color="#9CA3AF" />
          <StyledText className="text-gray-500 mt-4 text-center">
            No classes added yet
          </StyledText>
        </StyledView>
      )}
    </StyledScrollView>
  );
};

// Reports Screen Component (Empty for now)
const ReportsScreen = () => {
  return (
    <StyledView className="flex-1 bg-white p-6 top-10">
      <StyledText className="text-2xl font-bold text-gray-900 mb-6">
        Generate Reports
      </StyledText>
      <StyledView className="items-center justify-center flex-1">
        <Icon name="bar-chart-outline" size={48} color="#9CA3AF" />
        <StyledText className="text-gray-500 mt-4 text-center">
          Reports feature coming soon
        </StyledText>
      </StyledView>
    </StyledView>
  );
};

const TeacherDash: React.FC<Props> = ({ navigation }) => {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
    fetchClasses();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('SignIn');
        return;
      }

      const response = await axios.get(`${env.apiUrl}/api/teachers/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeacherData(response.data);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      navigation.navigate('SignIn');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${env.apiUrl}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.navigate('SignIn');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Classes') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }
          return <Icon name={iconName as string} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB'
        },
        headerShown: false
      })}
    >
      <Tab.Screen 
        name="Profile" 
        children={() => (
          <ProfileScreen 
            teacherData={teacherData} 
            handleLogout={handleLogout}
            fetchTeacherData={fetchTeacherData}
          />
        )}
      />
      <Tab.Screen 
        name="Classes" 
        children={() => <ClassesScreen classes={classes} navigation={navigation} />}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
      />
    </Tab.Navigator>
  );
};

export default TeacherDash; 