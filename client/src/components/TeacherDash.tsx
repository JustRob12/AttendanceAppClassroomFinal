import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

interface ProfileScreenProps {
  teacherData: TeacherData | null;
  handleLogout: () => Promise<void>;
  fetchTeacherData: () => Promise<void>;
}

const Tab = createBottomTabNavigator();

const ProfileScreen = ({ teacherData, handleLogout, fetchTeacherData }: ProfileScreenProps) => {
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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <TouchableOpacity 
            onPress={handleProfilePicture}
            style={styles.profileImageButton}
          >
            {teacherData?.profilePicture ? (
              <Image
                source={{ uri: teacherData.profilePicture }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Icon name="person" size={50} color="#9CA3AF" />
                <Text style={styles.uploadText}>
                  Tap to upload
                </Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>
            {teacherData?.firstName} {teacherData?.lastName}
          </Text>
          <Text style={styles.userRole}>Teacher</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Icon name="mail-outline" size={24} color="#6B7280" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{teacherData?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Icon name="call-outline" size={24} color="#6B7280" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{teacherData?.phoneNumber}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Icon name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const ClassesScreen = ({ classes, navigation }: { classes: ClassData[], navigation: any }) => {
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Classes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsClassModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Class</Text>
        </TouchableOpacity>
      </View>

      {classes.map((classItem) => (
        <TouchableOpacity 
          key={classItem.id} 
          style={styles.classCard}
          onPress={() => navigation.navigate('AttendanceClass', { classData: classItem })}
        >
          <View style={styles.classHeader}>
            <Text style={styles.subjectCode}>
              {classItem.subjectCode}
            </Text>
            <View style={styles.scheduleContainer}>
              <Icon name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.scheduleText}>
                {classItem.schedule}
              </Text>
            </View>
          </View>
          <View style={styles.classContent}>
            <Text style={styles.description}>
              {classItem.subjectDescription}
            </Text>
            <View style={styles.attendanceButton}>
              <Text style={styles.attendanceText}>
                Take Attendance
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <Class
        visible={isClassModalVisible}
        onClose={() => setIsClassModalVisible(false)}
        onClassAdded={() => {}}
      />

      {classes.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="book-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>
            No classes added yet
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const ReportsScreen = () => {
  return (
    <View style={[styles.container, styles.centerContent]}>
      <Text style={styles.headerTitle}>Generate Reports</Text>
      <View style={styles.emptyState}>
        <Icon name="bar-chart-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>
          Reports feature coming soon
        </Text>
      </View>
    </View>
  );
};

const TeacherDash = ({ navigation }: { navigation: any }) => {
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
        tabBarStyle: styles.tabBar,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  profileImageButton: {
    marginBottom: 12,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#F3F4F6',
  },
  placeholderContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    color: '#111827',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  classCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    marginBottom: 16,
  },
  attendanceButton: {
    alignSelf: 'flex-end',
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
    padding: 32,
  },
  emptyStateText: {
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
});

export default TeacherDash; 