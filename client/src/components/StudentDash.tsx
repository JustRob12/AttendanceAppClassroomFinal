import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { styled } from "nativewind";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import QRCode from 'react-native-qrcode-svg';
import env from '../config/env';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import Calendar from './Calendar';
import LoadingScreen from './LoadingScreen';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { captureRef } from 'react-native-view-shot';

type RootStackParamList = {
  StudentDash: undefined;
  SignIn: undefined;
};

type StudentDashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'StudentDash'>;

interface Props {
  navigation: StudentDashScreenNavigationProp;
}

interface StudentData {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  course: string;
  profilePicture?: string;
}

interface ClassData {
  id: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
  teacherFirstName: string;
  teacherLastName: string;
}

interface ProfileScreenProps {
  studentData: StudentData | null;
  handleLogout: () => Promise<void>;
  fetchStudentData: () => Promise<void>;
}

interface QRCodeScreenProps {
  studentData: StudentData | null;
}

interface SubjectsScreenProps {
  classes: ClassData[];
}

const Tab = createBottomTabNavigator();
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchable = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

// Profile Screen Component
const ProfileScreen = ({ studentData, handleLogout, fetchStudentData }: ProfileScreenProps) => {
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleImagePick = async () => {
    try {
      setIsImageUploading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "You need to allow access to your photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const formData = new FormData();
        formData.append('profilePicture', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile-picture.jpg',
        } as any);

        const token = await AsyncStorage.getItem('token');
        await axios.post(`${env.apiUrl}/api/students/profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        // Refresh student data to get updated profile picture
        fetchStudentData();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setIsImageUploading(false);
    }
  };

  if (isImageUploading) {
    return <LoadingScreen message="Uploading image..." />;
  }

  return (
    <StyledView className="flex-1 bg-white p-6">
      <StyledView className="flex-1 top-10">
        <StyledView className="items-center mb-8">
          <TouchableOpacity onPress={handleImagePick}>
            <StyledView 
              className="w-32 h-32 border-2 border-black rounded-full bg-gray-200 overflow-hidden"
            >
              {studentData?.profilePicture ? (
                <Image
                  source={{ uri: studentData.profilePicture }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <StyledView className="w-full h-full items-center justify-center">
                  <Icon name="person" size={50} color="#9CA3AF" />
                  <StyledText className="text-gray-500 text-sm mt-1">
                    Add Photo
                  </StyledText>
                </StyledView>
              )}
            </StyledView>
          </TouchableOpacity>
        </StyledView>

        <StyledView className="bg-gray-50 rounded-xl p-6 mb-6">
          <StyledText className="text-2xl font-bold text-gray-900 mb-6">
            Personal Information
          </StyledText>
          <StyledView className="space-y-4">
            <StyledView>
              <StyledText className="text-sm text-gray-500">Full Name</StyledText>
              <StyledText className="text-lg text-gray-900">{studentData?.firstName} {studentData?.lastName}</StyledText>
            </StyledView>
            <StyledView>
              <StyledText className="text-sm text-gray-500">Student ID</StyledText>
              <StyledText className="text-lg text-gray-900">{studentData?.studentId}</StyledText>
            </StyledView>
            <StyledView>
              <StyledText className="text-sm text-gray-500">Email</StyledText>
              <StyledText className="text-lg text-gray-900">{studentData?.email}</StyledText>
            </StyledView>
            <StyledView>
              <StyledText className="text-sm text-gray-500">Course</StyledText>
              <StyledText className="text-lg text-gray-900">{studentData?.course}</StyledText>
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

// QR Code Screen Component
const QRCodeScreen = ({ studentData }: QRCodeScreenProps) => {
  return (
    <View style={styles.container}>
      <ViewShot style={styles.contentContainer}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {studentData?.profilePicture ? (
              <Image
                source={{ uri: studentData.profilePicture }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Icon name="person" size={50} color="#9CA3AF" />
              </View>
            )}
          </View>
          <Text style={styles.name}>
            {studentData?.firstName} {studentData?.lastName}
          </Text>
          <Text style={styles.studentId}>
            {studentData?.studentId}
          </Text>
          <Text style={styles.course}>
            {studentData?.course}
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>
            My QR Code
          </Text>
          {studentData && (
            <QRCode
              value={JSON.stringify({
                studentId: studentData.studentId,
                course: studentData.course,
                name: `${studentData.firstName} ${studentData.lastName}`
              })}
              size={250}
              color="#111827"
              backgroundColor="transparent"
            />
          )}
        </View>
      </ViewShot>

      <View style={styles.screenshotHint}>
        <Icon name="camera-outline" size={24} color="#6B7280" />
        <Text style={styles.hintText}>
          Take a screenshot of your QR code to save it
        </Text>
      </View>
    </View>
  );
};

// Subjects Screen Component
const SubjectsScreen = ({ classes }: SubjectsScreenProps) => {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Loading subjects..." />;
  }

  return (
    <ScrollView style={styles.subjectsContainer}>
      <Text style={styles.subjectsTitle}>My Subjects</Text>
      {classes.map((classItem) => (
        <TouchableOpacity 
          key={classItem.id} 
          style={styles.classCard}
          onPress={() => {
            setSelectedClassId(classItem.id);
            setSelectedSubject(classItem.subjectCode);
          }}
        >
          <View style={styles.classHeader}>
            <Text style={styles.subjectCode}>{classItem.subjectCode}</Text>
            <View style={styles.scheduleContainer}>
              <Icon name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.scheduleText}>{classItem.schedule}</Text>
            </View>
          </View>

          <View style={styles.classContent}>
            <Text style={styles.description}>{classItem.subjectDescription}</Text>
            <View style={styles.teacherContainer}>
              <Icon name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.teacherName}>
                {classItem.teacherFirstName} {classItem.teacherLastName}
              </Text>
            </View>
            <View style={styles.attendanceContainer}>
              <View style={styles.attendanceButton}>
                <Text style={styles.attendanceText}>View Attendance</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      <Calendar 
        classId={selectedClassId || 0}
        visible={selectedClassId !== null}
        subjectName={selectedSubject}
        onClose={() => setSelectedClassId(null)}
      />
      {classes.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="book-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No subjects enrolled yet</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 24,
  },
  contentContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'black',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  studentId: {
    fontSize: 16,
    color: '#6B7280',
  },
  course: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  qrContainer: {
    backgroundColor: '#F9FAFB',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  screenshotHint: {
    marginTop: 24,
    alignItems: 'center',
  },
  hintText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  subjectsContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 40,
  },
  subjectsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  classCard: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  classHeader: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  subjectCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scheduleText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  classContent: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  teacherName: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  attendanceContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  attendanceButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  attendanceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

const StudentDash: React.FC<Props> = ({ navigation }) => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
    fetchClasses();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('SignIn');
        return;
      }

      const response = await axios.get(`${env.apiUrl}/api/students/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentData(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
      navigation.navigate('SignIn');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${env.apiUrl}/api/enrollments/student/classes`, {
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
          } else if (route.name === 'QR Code') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Subjects') {
            iconName = focused ? 'book' : 'book-outline';
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
        children={() => <ProfileScreen studentData={studentData} handleLogout={handleLogout} fetchStudentData={fetchStudentData} />}
      />
      <Tab.Screen 
        name="QR Code" 
        children={() => <QRCodeScreen studentData={studentData} />}
      />
      <Tab.Screen 
        name="Subjects" 
        children={() => <SubjectsScreen classes={classes} />}
      />
    </Tab.Navigator>
  );
};

export default StudentDash; 