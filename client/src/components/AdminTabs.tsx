import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import env from '../config/env';

// Import components
import AdminDashboard from './AdminDashboard';

type AdminData = {
  firstName: string;
  lastName: string;
  email: string;
};

type TeacherData = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type StudentData = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  course: string;
};

const Tab = createBottomTabNavigator();

// Dashboard screen component
const DashboardScreen = () => {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.get(`${env.apiUrl}/api/admins/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminData(response.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              // Navigation will be handled by the parent component
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.profileName}>{adminData?.firstName} {adminData?.lastName}</Text>
        <Text style={styles.profileEmail}>{adminData?.email}</Text>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <AdminDashboard />
    </SafeAreaView>
  );
};

// Teachers screen component
const TeachersScreen = () => {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.get(`${env.apiUrl}/api/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading teachers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teachers</Text>
      </View>
      
      <ScrollView style={styles.listContainer}>
        {teachers.map(teacher => (
          <View key={teacher.id} style={styles.listItem}>
            <Text style={styles.itemName}>{teacher.firstName} {teacher.lastName}</Text>
            <Text style={styles.itemDetail}>{teacher.email}</Text>
            <Text style={styles.itemDetail}>{teacher.phoneNumber}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// Students screen component
const StudentsScreen = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.get(`${env.apiUrl}/api/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading students...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Students</Text>
      </View>
      
      <ScrollView style={styles.listContainer}>
        {students.map(student => (
          <View key={student.id} style={styles.listItem}>
            <Text style={styles.itemName}>{student.firstName} {student.lastName}</Text>
            <Text style={styles.itemDetail}>ID: {student.studentId}</Text>
            <Text style={styles.itemDetail}>{student.course}</Text>
            <Text style={styles.itemDetail}>{student.email}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// Main Admin Tabs component
const AdminTabs = ({ navigation }: { navigation: any }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Teachers') {
            iconName = 'team';
          } else if (route.name === 'Students') {
            iconName = 'user';
          }
          
          return <AntDesign name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
      />
      <Tab.Screen 
        name="Teachers" 
        component={TeachersScreen} 
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsScreen} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileSection: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    marginHorizontal: 16,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});

export default AdminTabs; 