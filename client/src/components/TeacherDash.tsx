import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import env from '../config/env';
import { AntDesign } from '@expo/vector-icons';
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
  keycode?: string;
}

interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  averageAttendance: number;
}

interface ProfileScreenProps {
  teacherData: TeacherData | null;
  handleLogout: () => Promise<void>;
  fetchTeacherData: () => Promise<void>;
  stats: TeacherStats;
}

const Tab = createBottomTabNavigator();

const ProfileScreen = ({ teacherData, handleLogout, fetchTeacherData, stats }: ProfileScreenProps) => {
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
      {/* Profile Header Section */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageSection}>
          <TouchableOpacity 
            onPress={handleProfilePicture}
            style={styles.profileImageWrapper}
          >
            {teacherData?.profilePicture ? (
              <Image
                source={{ uri: teacherData.profilePicture }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <AntDesign name="user" size={50} color="#9CA3AF" />
                <Text style={styles.uploadText}>Tap to change</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.nameSection}>
            <Text style={styles.userName}>
              {teacherData?.firstName} {teacherData?.lastName}
            </Text>
            <View style={styles.badgeContainer}>
              <AntDesign name="star" size={16} color="#FFD700" />
              <Text style={styles.userRole}>Faculty Member</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalClasses}</Text>
          <Text style={styles.statLabel}>Classes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.averageAttendance}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
      </View>

      {/* Info Cards */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Contact Information</Text>
            <AntDesign name="contacts" size={24} color="#4F46E5" />
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <AntDesign name="mail" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{teacherData?.email}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <AntDesign name="phone" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{teacherData?.phoneNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Quick Actions</Text>
            <AntDesign name="appstore-o" size={24} color="#4F46E5" />
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                <AntDesign name="calendar" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <AntDesign name="notification" size={24} color="#D97706" />
              </View>
              <Text style={styles.actionText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#DCF5F0' }]}>
                <AntDesign name="setting" size={24} color="#059669" />
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View> */}
      </ScrollView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <AntDesign name="logout" size={20} color="white" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const ClassesScreen = ({ classes, navigation, fetchClasses }: { classes: ClassData[], navigation: any, fetchClasses: () => Promise<void> }) => {
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentEditClass, setCurrentEditClass] = useState<ClassData | null>(null);
  const [showKeyCodeModal, setShowKeyCodeModal] = useState(false);
  const [currentKeyCode, setCurrentKeyCode] = useState<string>('');
  const [loadingKeyCode, setLoadingKeyCode] = useState(false);

  const handleEditClass = (classItem: ClassData) => {
    setCurrentEditClass(classItem);
    setIsEditModalVisible(true);
  };

  const handleDeleteClass = (classId: number) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this class? This will also delete all enrolled students and attendance records for this class.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${env.apiUrl}/api/classes/${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchClasses();
              Alert.alert('Success', 'Class deleted successfully');
            } catch (error) {
              console.error('Error deleting class:', error);
              Alert.alert('Error', 'Failed to delete class');
            }
          }
        }
      ]
    );
  };

  const handleClassAdded = () => {
    fetchClasses();
  };

  const generateKeyCode = async (classId: number) => {
    try {
      setLoadingKeyCode(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${env.apiUrl}/api/classes/${classId}/generate-keycode`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCurrentKeyCode(response.data.keycode);
      setShowKeyCodeModal(true);
      fetchClasses(); // Refresh class list to get updated keycode
    } catch (error) {
      console.error('Error generating key code:', error);
      Alert.alert('Error', 'Failed to generate key code');
    } finally {
      setLoadingKeyCode(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.classesHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.classesHeaderTitle}>My Classes</Text>
          <Text style={styles.classesSubtitle}>Manage your class schedule and attendance</Text>
        </View>
        <TouchableOpacity
          style={styles.addClassButton}
          onPress={() => setIsClassModalVisible(true)}
        >
          <AntDesign name="plus" size={24} color="white" />
          <Text style={styles.addClassButtonText}>Add Class</Text>
        </TouchableOpacity>
      </View>

      {/* Classes List */}
      <ScrollView 
        style={styles.classesScrollContainer}
        contentContainerStyle={styles.classesContent}
      >
        {classes.map((classItem) => (
          <TouchableOpacity 
            key={classItem.id} 
            style={styles.enhancedClassCard}
            onPress={() => navigation.navigate('AttendanceClass', { classData: classItem })}
          >
            <View style={styles.classCardHeader}>
              <View style={styles.subjectCodeContainer}>
                <Text style={styles.enhancedSubjectCode}>
                  {classItem.subjectCode}
                </Text>
                <Text style={styles.enhancedDescription}>
                  {classItem.subjectDescription}
                </Text>
              </View>
              <View style={styles.enhancedScheduleContainer}>
                <AntDesign name="clockcircleo" size={16} color="#6B7280" />
                <Text style={styles.enhancedScheduleText}>
                  {classItem.schedule}
                </Text>
              </View>
            </View>

            <View style={styles.classCardActions}>
              <TouchableOpacity 
                style={styles.enhancedAttendanceButton}
                onPress={() => navigation.navigate('AttendanceClass', { classData: classItem })}
              >
                <AntDesign name="calendar" size={20} color="#4F46E5" />
                <Text style={styles.enhancedAttendanceText}>Take Attendance</Text>
              </TouchableOpacity>

              <View style={styles.managementButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.managementButton, { backgroundColor: '#DCFCE7' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    generateKeyCode(classItem.id);
                  }}
                >
                 
                  <AntDesign name="edit" size={20} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.managementButton, { backgroundColor: '#FEE2E2' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteClass(classItem.id);
                  }}
                >
                  <AntDesign name="delete" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {classes.length === 0 && (
          <View style={styles.enhancedEmptyState}>
            <View style={styles.emptyStateIconContainer}>
              <AntDesign name="book" size={48} color="#4F46E5" />
            </View>
            <Text style={styles.enhancedEmptyStateTitle}>
              No Classes Yet
            </Text>
            <Text style={styles.enhancedEmptyStateText}>
              Start by adding your first class using the button above
            </Text>
          </View>
        )}
      </ScrollView>

      <Class
        visible={isClassModalVisible}
        onClose={() => setIsClassModalVisible(false)}
        onClassAdded={handleClassAdded}
      />

      {currentEditClass && (
        <Class
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setCurrentEditClass(null);
          }}
          onClassAdded={handleClassAdded}
          classToEdit={currentEditClass}
        />
      )}

      {/* Key Code Modal */}
      <Modal
        visible={showKeyCodeModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.keyCodeModalOverlay}>
          <View style={styles.keyCodeModalContent}>
            <View style={styles.keyCodeIconContainer}>
              <AntDesign name="key" size={40} color="#059669" />
            </View>
            <Text style={styles.keyCodeTitle}>Class Key Code</Text>
            <Text style={styles.keyCodeDescription}>
              Share this code with your students to verify their attendance
            </Text>
            <View style={styles.keyCodeContainer}>
              <Text style={styles.keyCode}>{currentKeyCode}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeKeyCodeButton}
              onPress={() => setShowKeyCodeModal(false)}
            >
              <Text style={styles.closeKeyCodeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ReportsScreen = () => {
  return (
    <View style={[styles.container, styles.centerContent]}>
      <Text style={styles.headerTitle}>Generate Reports</Text>
      <View style={styles.emptyState}>
        <AntDesign name="barchart" size={48} color="#9CA3AF" />
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
  const [stats, setStats] = useState<TeacherStats>({
    totalClasses: 0,
    totalStudents: 0,
    averageAttendance: 0
  });

  useEffect(() => {
    fetchTeacherData();
    fetchClasses();
  }, []);

  const calculateStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      // Set initial stats with classes length
      let newStats = {
        totalClasses: classes.length,
        totalStudents: 0,
        averageAttendance: 0
      };

      // Get total number of students enrolled in all classes
      const studentsResponse = await axios.get(`${env.apiUrl}/api/teachers/total-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Students response:', studentsResponse.data);
      newStats.totalStudents = studentsResponse.data.totalStudents || 0;

      // Get average attendance percentage
      const attendanceResponse = await axios.get(`${env.apiUrl}/api/teachers/average-attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Attendance response:', attendanceResponse.data);
      newStats.averageAttendance = Math.round(attendanceResponse.data.averageAttendance || 0);

      console.log('Setting new stats:', newStats);
      setStats(newStats);
    } catch (error: any) {
      console.error('Error calculating stats:', error.response?.data || error.message);
      // Set default stats if there's an error
      setStats({
        totalClasses: classes.length,
        totalStudents: 0,
        averageAttendance: 0
      });
    }
  };

  useEffect(() => {
    if (classes.length > 0) {
      calculateStats();
    }
  }, [classes]);

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
          const iconName = 
            route.name === 'Profile' ? 'user' :
            route.name === 'Classes' ? 'book' :
            'barchart';
          return <AntDesign name={iconName} size={size} color={color} />;
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
            stats={stats}
          />
        )}
      />
      <Tab.Screen 
        name="Classes" 
        children={() => <ClassesScreen classes={classes} navigation={navigation} fetchClasses={fetchClasses} />}
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
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageSection: {
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userRole: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  infoContent: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  managementButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 6,
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
  classesHeader: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    marginBottom: 20,
  },
  classesHeaderTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  classesSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addClassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  addClassButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  classesScrollContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  classesContent: {
    padding: 20,
  },
  enhancedClassCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  classCardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subjectCodeContainer: {
    marginBottom: 12,
  },
  enhancedSubjectCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  enhancedDescription: {
    fontSize: 16,
    color: '#4B5563',
  },
  enhancedScheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  enhancedScheduleText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  classCardActions: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  enhancedAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  managementButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  managementButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  enhancedAttendanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  enhancedEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  enhancedEmptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  enhancedEmptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  keyCodeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyCodeModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  keyCodeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  keyCodeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  keyCodeDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  keyCodeContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  keyCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 2,
  },
  closeKeyCodeButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  closeKeyCodeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TeacherDash; 