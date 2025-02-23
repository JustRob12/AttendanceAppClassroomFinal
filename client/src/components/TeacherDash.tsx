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
import env from '../config/env';
import Class from './Class';

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
}

interface ClassData {
  id: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
}

const TeacherDash: React.FC<Props> = ({ navigation }) => {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);

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
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome, {teacherData?.firstName}!</Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Text style={styles.infoText}>Name: {teacherData?.firstName} {teacherData?.lastName}</Text>
          <Text style={styles.infoText}>Email: {teacherData?.email}</Text>
          <Text style={styles.infoText}>Phone: {teacherData?.phoneNumber}</Text>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.greenButton]}>
            <Text style={styles.actionButtonText}>Create New Class</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.blueButton]}>
            <Text style={styles.actionButtonText}>View Students</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.classesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Classes</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setIsClassModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add Class</Text>
            </TouchableOpacity>
          </View>

          {classes.map((classItem) => (
            <TouchableOpacity 
              key={classItem.id} 
              style={styles.classCard}
              onPress={() => navigation.navigate('AttendanceClass', { classData: classItem })}
            >
              <Text style={styles.classCode}>{classItem.subjectCode}</Text>
              <Text style={styles.classDescription}>{classItem.subjectDescription}</Text>
              <Text style={styles.classSchedule}>{classItem.schedule}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Class
        visible={isClassModalVisible}
        onClose={() => setIsClassModalVisible(false)}
        onClassAdded={fetchClasses}
      />
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
  actionsCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  greenButton: {
    backgroundColor: '#059669',
  },
  blueButton: {
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  classesSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
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
  },
});

export default TeacherDash; 