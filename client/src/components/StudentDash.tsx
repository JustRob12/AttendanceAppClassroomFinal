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
  Modal,
  TextInput
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { styled } from "nativewind";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import QRCode from 'react-native-qrcode-svg';
import env from '../config/env';
import { AntDesign } from '@expo/vector-icons';
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
  fetchClasses: () => Promise<void>;
}

const Tab = createBottomTabNavigator();
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchable = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

// Profile Screen Component
const ProfileScreen = ({ studentData, handleLogout, fetchStudentData }: ProfileScreenProps) => {
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async () => {
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
        await axios.post(`${env.apiUrl}/api/students/profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        await fetchStudentData();
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
            onPress={handleImagePick}
            style={styles.profileImageWrapper}
          >
            {studentData?.profilePicture ? (
              <Image
                source={{ uri: studentData.profilePicture }}
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
              {studentData?.firstName} {studentData?.lastName}
            </Text>
            <View style={styles.badgeContainer}>
              <AntDesign name="star" size={16} color="#FFD700" />
              <Text style={styles.userRole}>Student</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Cards */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Student Information</Text>
            <AntDesign name="idcard" size={24} color="#4F46E5" />
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <AntDesign name="user" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Student ID</Text>
                <Text style={styles.infoValue}>{studentData?.studentId}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <AntDesign name="book" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoValue}>{studentData?.course}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <AntDesign name="mail" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{studentData?.email}</Text>
              </View>
            </View>
          </View>
        </View>
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

// QR Code Screen Component
const QRCodeScreen = ({ studentData }: QRCodeScreenProps) => {
  const [showQR, setShowQR] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const qrRef = React.useRef<ViewShot>(null);

  useEffect(() => {
    if (studentData) {
      const qrData = {
        studentId: studentData.studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        course: studentData.course
      };
      setQrValue(JSON.stringify(qrData));
      setIsLoading(false);
    }
  }, [studentData]);

  const handleSaveQR = async () => {
    if (!qrRef.current) return;

    try {
      setSaving(true);
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save the QR code');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'QR code saved to gallery');
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code');
    } finally {
      setSaving(false);
    }
  };

  if (!studentData?.profilePicture) {
    return (
      <View style={styles.qrContainer}>
        <Text style={styles.qrMessage}>
          Please upload your profile picture first to access your QR code.
        </Text>
        <Text style={styles.qrSubMessage}>
          Go to Profile tab to upload your picture.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.qrContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.qrContainer}>
      <View style={styles.qrHeader}>
        <View style={styles.qrProfileSection}>
          <View style={styles.qrProfileImageWrapper}>
            <Image
              source={{ uri: studentData.profilePicture }}
              style={styles.qrProfileImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.qrNameSection}>
            <Text style={styles.qrUserName}>
              {studentData.firstName} {studentData.lastName}
            </Text>
            <Text style={styles.qrUserId}>{studentData.studentId}</Text>
            <Text style={styles.qrUserCourse}>{studentData.course}</Text>
          </View>
        </View>
      </View>

      <View style={styles.qrCodeSection}>
        <View style={styles.warningContainer}>
          <AntDesign name="warning" size={24} color="#DC2626" />
          <Text style={styles.warningText}>
            Do not share your QR code with others
          </Text>
        </View>

        <ViewShot ref={qrRef} style={styles.qrCodeContainer}>
          {qrValue && (
            <QRCode
              value={qrValue}
              size={200}
              backgroundColor="white"
              color="black"
            />
          )}
        </ViewShot>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveQR}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save QR Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Subjects Screen Component
const SubjectsScreen = ({ classes, fetchClasses }: SubjectsScreenProps) => {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [keyCode, setKeyCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handleEnrollment = async () => {
    if (!keyCode.trim()) {
      Alert.alert('Error', 'Please enter a key code');
      return;
    }

    try {
      setEnrolling(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${env.apiUrl}/api/enrollments/enroll`,
        { keycode: keyCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Successfully enrolled in the class');
      setKeyCode('');
      setShowEnrollModal(false);
      // Refresh the classes list
      fetchClasses();
    } catch (error: any) {
      console.error('Error enrolling:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to enroll in the class'
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading subjects..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.classesHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.classesHeaderTitle}>My Subjects</Text>
          <Text style={styles.classesSubtitle}>
            {classes.length} {classes.length === 1 ? 'Subject' : 'Subjects'} Enrolled
          </Text>
        </View>
        {/* <TouchableOpacity
          style={styles.addClassButton}
          onPress={() => setShowEnrollModal(true)}
        >
          <AntDesign name="plus" size={24} color="white" />
          <Text style={styles.addClassButtonText}>Enroll Subject</Text>
        </TouchableOpacity> */}
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
            onPress={() => {
              setSelectedClassId(classItem.id);
              setSelectedSubject(classItem.subjectCode);
            }}
          >
            <View style={styles.classCardHeader}>
              <View style={styles.subjectCodeContainer}>
                <Text style={styles.enhancedSubjectCode}>{classItem.subjectCode}</Text>
                <Text style={styles.enhancedDescription}>{classItem.subjectDescription}</Text>
              </View>
              <View style={styles.enhancedScheduleContainer}>
                <AntDesign name="clockcircleo" size={16} color="#4B5563" />
                <Text style={styles.enhancedScheduleText}>{classItem.schedule}</Text>
              </View>
            </View>

            <View style={styles.classCardContent}>
              <View style={styles.teacherInfoContainer}>
                <View style={styles.teacherIconContainer}>
                  <AntDesign name="user" size={20} color="#4F46E5" />
                </View>
                <View style={styles.teacherTextContainer}>
                  <Text style={styles.teacherLabel}>Instructor</Text>
                  <Text style={styles.teacherValue}>
                    {classItem.teacherFirstName} {classItem.teacherLastName}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.viewAttendanceButton}
                onPress={() => {
                  setSelectedClassId(classItem.id);
                  setSelectedSubject(classItem.subjectCode);
                }}
              >
                <AntDesign name="calendar" size={20} color="#4F46E5" />
                <Text style={styles.viewAttendanceText}>View Attendance</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {classes.length === 0 && (
          <View style={styles.enhancedEmptyState}>
            <View style={styles.emptyStateIconContainer}>
              <AntDesign name="book" size={40} color="#4F46E5" />
            </View>
            <Text style={styles.emptyStateTitle}>No Subjects Yet</Text>
            <Text style={styles.emptyStateDescription}>
              You haven't enrolled in any subjects yet.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Enroll Modal */}
      <Modal
        visible={showEnrollModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEnrollModal(false)}
      >
        <View style={styles.enrollModalOverlay}>
          <View style={styles.enrollModalContent}>
            <View style={styles.enrollModalHeader}>
              <Text style={styles.enrollModalTitle}>Enroll in Subject</Text>
              <Text style={styles.enrollModalSubtitle}>
                Enter the key code provided by your teacher
              </Text>
            </View>

            <View style={styles.keyCodeInputContainer}>
              <TextInput
                style={styles.keyCodeInput}
                placeholder="Enter key code"
                value={keyCode}
                onChangeText={setKeyCode}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            <View style={styles.enrollModalActions}>
              <TouchableOpacity
                style={[styles.enrollModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEnrollModal(false);
                  setKeyCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.enrollModalButton,
                  styles.enrollButton,
                  enrolling && styles.enrollingButton
                ]}
                onPress={handleEnrollment}
                disabled={enrolling}
              >
                {enrolling ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.enrollButtonText}>Enroll</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Calendar 
        classId={selectedClassId || 0}
        visible={selectedClassId !== null}
        subjectName={selectedSubject}
        onClose={() => setSelectedClassId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  classCardContent: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  teacherInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teacherIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teacherTextContainer: {
    flex: 1,
  },
  teacherLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  teacherValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  viewAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewAttendanceText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  addClassButton: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addClassButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  enrollModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrollModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  enrollModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  enrollModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  enrollModalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  keyCodeInputContainer: {
    marginBottom: 24,
  },
  keyCodeInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 2,
  },
  enrollModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  enrollModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  enrollButton: {
    backgroundColor: '#4F46E5',
  },
  enrollingButton: {
    opacity: 0.7,
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  qrContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  qrHeader: {
    backgroundColor: '#4F46E5',
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  qrProfileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  qrProfileImageWrapper: {
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
    marginBottom: 16,
  },
  qrProfileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  qrNameSection: {
    alignItems: 'center',
  },
  qrUserName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  qrUserId: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  qrUserCourse: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  qrCodeSection: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    fontWeight: '500',
  },
  qrCodeContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  qrMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  qrSubMessage: {
    fontSize: 14,
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
    } finally {
      setLoading(false);
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
            route.name === 'QR Code' ? 'qrcode' :
            'book';
          return <AntDesign name={iconName} size={size} color={color} />;
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
        children={() => <SubjectsScreen classes={classes} fetchClasses={fetchClasses} />}
      />
    </Tab.Navigator>
  );
};

export default StudentDash; 