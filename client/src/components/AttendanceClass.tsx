import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
  Image
} from 'react-native';
import { CameraView, BarcodeScanningResult, Camera } from 'expo-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';
import LoadingScreen from './LoadingScreen';
import env from '../config/env';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  AttendanceClass: { classData: ClassData };
  TeacherDash: undefined;
};

type AttendanceClassScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AttendanceClass'
>;

type AttendanceClassScreenRouteProp = RouteProp<
  RootStackParamList,
  'AttendanceClass'
>;

interface Props {
  navigation: AttendanceClassScreenNavigationProp;
  route: AttendanceClassScreenRouteProp;
}

interface ClassData {
  id: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
}

interface StudentData {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  course: string;
  profilePicture?: string;
}

interface AttendanceData {
  studentId: number;
  status: 'present' | 'absent';
}

interface ScannedStudent {
  studentId: string;
  name: string;
  course: string;
}

const AttendanceClass: React.FC<Props> = ({ navigation, route }) => {
  const { classData } = route.params;
  const [enrolledStudents, setEnrolledStudents] = useState<StudentData[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentData[]>([]);
  const [isEnrollModalVisible, setIsEnrollModalVisible] = useState(false);
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<{ [key: number]: 'present' | 'absent' | null }>({});
  const [todayAttendance, setTodayAttendance] = useState<{ [key: number]: string }>({});
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<StudentData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    fetchEnrolledStudents();
    fetchAvailableStudents();
    fetchTodayAttendance();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      console.error('Error checking permissions:', err);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${env.apiUrl}/api/enrollments/class/${classData.id}/enrolled-students`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEnrolledStudents(response.data);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      Alert.alert('Error', 'Failed to fetch enrolled students');
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${env.apiUrl}/api/enrollments/class/${classData.id}/available-students`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAvailableStudents(response.data);
    } catch (error) {
      console.error('Error fetching available students:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${env.apiUrl}/api/attendance/class/${classData.id}/today`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const attendanceData = response.data.reduce((acc: any, curr: any) => {
        acc[curr.studentId] = curr.status;
        return acc;
      }, {});
      setTodayAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const handleEnrollStudents = async () => {
    try {
      if (selectedStudents.length === 0) {
        Alert.alert('Error', 'Please select students to enroll');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${env.apiUrl}/api/enrollments/class/${classData.id}/enroll`,
        { studentIds: selectedStudents },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      Alert.alert('Success', 'Students enrolled successfully');
      setIsEnrollModalVisible(false);
      setSelectedStudents([]);
      fetchEnrolledStudents();
      fetchAvailableStudents();
    } catch (error) {
      console.error('Error enrolling students:', error);
      Alert.alert('Error', 'Failed to enroll students');
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(
        `${env.apiUrl}/api/enrollments/class/${classData.id}/student/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      Alert.alert('Success', 'Student removed successfully');
      fetchEnrolledStudents();
      fetchAvailableStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      Alert.alert('Error', 'Failed to remove student');
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const markAttendance = async (studentId: number, status: 'present' | 'absent') => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${env.apiUrl}/api/attendance/mark`,
        {
          classId: classData.id,
          studentId,
          status
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAttendanceMap(prev => ({
        ...prev,
        [studentId]: status
      }));
      
      fetchTodayAttendance(); // Refresh attendance data
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/beep.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    try {
      setScanned(true);
      await playBeep();
      const scannedData = JSON.parse(data);
      // Fetch complete student data including profile picture
      const fetchStudentData = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const response = await axios.get(
            `${env.apiUrl}/api/students/profile/${scannedData.studentId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          const student = enrolledStudents.find(s => s.studentId === scannedData.studentId);
          if (student) {
            setScannedStudent({ ...student, profilePicture: response.data.profilePicture });
            setShowConfirmModal(true);
          } else {
            Alert.alert('Error', 'Student not enrolled in this class');
          }
        } catch (error) {
          console.error('Error fetching student data:', error);
          Alert.alert('Error', 'Failed to fetch student data');
        }
      };

      fetchStudentData();
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code');
    }
  };

  const renderStudentCard = (student: StudentData) => (
    <View style={styles.studentCard} key={student.id}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {student.firstName} {student.lastName}
        </Text>
        <Text style={styles.studentId}>ID: {student.studentId}</Text>
        <Text style={styles.studentCourse}>{student.course}</Text>
      </View>
      <View style={styles.attendanceButtons}>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            styles.presentButton,
            todayAttendance[student.id] === 'present' && styles.presentActive
          ]}
          onPress={() => markAttendance(student.id, 'present')}
        >
          <Icon 
            name="checkmark" 
            size={20} 
            color={todayAttendance[student.id] === 'present' ? '#fff' : '#9CA3AF'} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            styles.absentButton,
            todayAttendance[student.id] === 'absent' && styles.absentActive
          ]}
          onPress={() => markAttendance(student.id, 'absent')}
        >
          <Icon 
            name="close" 
            size={20} 
            color={todayAttendance[student.id] === 'absent' ? '#fff' : '#9CA3AF'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{classData.subjectCode}</Text>
          <Text style={styles.headerSubtitle}>{classData.schedule}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.classInfoCard}>
          <Text style={styles.classDescription}>
            {classData.subjectDescription}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setIsEnrollModalVisible(true)}
          >
            <Icon name="person-add" size={20} color="white" />
            <Text style={styles.actionButtonText}>Add Students</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setScannerVisible(true)}
          >
            <Icon name="qr-code" size={20} color="white" />
            <Text style={styles.actionButtonText}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Enrolled Students</Text>
        {enrolledStudents.map(renderStudentCard)}
      </ScrollView>

      <Modal
        visible={isEnrollModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Students</Text>
            </View>
            
            <FlatList
              data={availableStudents}
              style={styles.studentList}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.studentSelectItem,
                    selectedStudents.includes(item.id) && styles.selectedItem
                  ]}
                  onPress={() => toggleStudentSelection(item.id)}
                >
                  <Text style={styles.studentSelectName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.studentSelectId}>
                    ID: {item.studentId}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={handleEnrollStudents}
              >
                <Text style={styles.enrollButtonText}>Enroll Selected</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEnrollModalVisible(false);
                  setSelectedStudents([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isScannerVisible && (
        <View style={styles.scannerOverlayContainer}>
          <View style={styles.scannerBox}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.scannerIndicator}>
              <View style={[styles.scannerCorner, styles.topLeft]} />
              <View style={[styles.scannerCorner, styles.topRight]} />
              <View style={[styles.scannerCorner, styles.bottomLeft]} />
              <View style={[styles.scannerCorner, styles.bottomRight]} />
            </View>
          </View>
          <Text style={styles.scanText}>
            Position QR code within the frame to scan
          </Text>
          <TouchableOpacity
            style={styles.closeScannerButton}
            onPress={() => {
              setScannerVisible(false);
              setScanned(false);
            }}
          >
            <Text style={styles.closeScannerText}>Close Scanner</Text>
          </TouchableOpacity>
          {scanned && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showConfirmModal && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModalContent}>
              <View style={styles.studentProfileContainer}>
                <View style={styles.studentProfilePic}>
                  {scannedStudent?.profilePicture ? (
                    <Image
                      source={{ uri: scannedStudent.profilePicture }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Icon name="person" size={40} color="#9CA3AF" />
                  )}
                </View>
                <Text style={styles.studentModalName}>
                  {scannedStudent?.firstName} {scannedStudent?.lastName}
                </Text>
                <Text style={styles.studentModalId}>
                  ID: {scannedStudent?.studentId}
                </Text>
                <Text style={styles.studentModalCourse}>
                  {scannedStudent?.course}
                </Text>
              </View>

              <View style={styles.confirmModalActions}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => {
                    if (scannedStudent) {
                      markAttendance(scannedStudent.id, 'present');
                      setShowConfirmModal(false);
                      setScanned(false);
                    }
                  }}
                >
                  <Text style={styles.confirmButtonText}>Mark Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={() => {
                    setShowConfirmModal(false);
                    setScanned(false);
                  }}
                >
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 70,
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  classInfoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classDescription: {
    fontSize: 16,
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  studentId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  studentCourse: {
    fontSize: 14,
    color: '#6B7280',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  presentButton: {
    borderColor: '#10B981',
  },
  absentButton: {
    borderColor: '#EF4444',
  },
  presentActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  absentActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  studentList: {
    maxHeight: '70%',
    padding: 16,
  },
  studentSelectItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedItem: {
    backgroundColor: '#F3F4F6',
    borderColor: '#111827',
  },
  studentSelectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  studentSelectId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  modalActions: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  enrollButton: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
  },
  enrollButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#111827',
    textAlign: 'center',
    fontWeight: '500',
  },
  scannerOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scannerBox: {
    width: 300,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#fff',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  scannerIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  scannerCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00ff00',
    borderWidth: 3,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  closeScannerButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    width: 300,
  },
  closeScannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  studentProfileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  studentProfilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  studentModalName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  studentModalId: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentModalCourse: {
    fontSize: 14,
    color: '#6B7280',
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AttendanceClass; 