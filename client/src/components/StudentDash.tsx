import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import QRCode from 'react-native-qrcode-svg';
import env from '../config/env';

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
}

interface ClassData {
  id: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
  teacherFirstName: string;
  teacherLastName: string;
}

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
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome, {studentData?.firstName}!</Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Text style={styles.infoText}>Name: {studentData?.firstName} {studentData?.lastName}</Text>
          <Text style={styles.infoText}>Student ID: {studentData?.studentId}</Text>
          <Text style={styles.infoText}>Email: {studentData?.email}</Text>
          <Text style={styles.infoText}>Course: {studentData?.course}</Text>
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>My QR Code</Text>
          <View style={styles.qrContainer}>
            {studentData && (
              <QRCode
                value={JSON.stringify({
                  studentId: studentData.studentId,
                  course: studentData.course,
                  name: `${studentData.firstName} ${studentData.lastName}`
                })}
                size={200}
                color="#4F46E5"
                backgroundColor="white"
              />
            )}
          </View>
        </View>

        <View style={styles.classesSection}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          {classes.map((classItem) => (
            <View key={classItem.id} style={styles.classCard}>
              <Text style={styles.classCode}>{classItem.subjectCode}</Text>
              <Text style={styles.classDescription}>{classItem.subjectDescription}</Text>
              <Text style={styles.classSchedule}>Schedule: {classItem.schedule}</Text>
              <Text style={styles.teacherName}>
                Teacher: {classItem.teacherFirstName} {classItem.teacherLastName}
              </Text>
            </View>
          ))}
          {classes.length === 0 && (
            <Text style={styles.noClassesText}>No classes enrolled yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  qrSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  classesSection: {
    marginTop: 20,
  },
  classCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  classCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 5,
  },
  classDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  classSchedule: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  teacherName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noClassesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default StudentDash; 