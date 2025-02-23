import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import env from '../config/env';

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
}

const AttendanceClass: React.FC<Props> = ({ navigation, route }) => {
  const { classData } = route.params;
  const [enrolledStudents, setEnrolledStudents] = useState<StudentData[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentData[]>([]);
  const [isEnrollModalVisible, setIsEnrollModalVisible] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  useEffect(() => {
    fetchEnrolledStudents();
    fetchAvailableStudents();
  }, []);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{classData.subjectCode}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.classInfo}>
          <Text style={styles.classDescription}>{classData.subjectDescription}</Text>
          <Text style={styles.schedule}>Schedule: {classData.schedule}</Text>
        </View>

        <View style={styles.enrolledSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Enrolled Students</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setIsEnrollModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add Students</Text>
            </TouchableOpacity>
          </View>

          {enrolledStudents.map(student => (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {student.firstName} {student.lastName}
                </Text>
                <Text style={styles.studentDetails}>ID: {student.studentId}</Text>
                <Text style={styles.studentDetails}>Course: {student.course}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveStudent(student.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={isEnrollModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEnrollModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Students</Text>
            
            <FlatList
              data={availableStudents}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.studentSelectCard,
                    selectedStudents.includes(item.id) && styles.selectedCard
                  ]}
                  onPress={() => toggleStudentSelection(item.id)}
                >
                  <Text style={styles.studentName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.studentDetails}>ID: {item.studentId}</Text>
                  <Text style={styles.studentDetails}>Course: {item.course}</Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.enrollButton]}
                onPress={handleEnrollStudents}
              >
                <Text style={styles.buttonText}>Enroll Selected</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsEnrollModalVisible(false);
                  setSelectedStudents([]);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  classInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  classDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  schedule: {
    fontSize: 14,
    color: '#888',
  },
  enrolledSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    padding: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    backgroundColor: '#DC2626',
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  studentSelectCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedCard: {
    backgroundColor: '#E0E7FF',
    borderColor: '#4F46E5',
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  enrollButton: {
    backgroundColor: '#4F46E5',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AttendanceClass; 