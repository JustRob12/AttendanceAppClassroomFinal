import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import axiosInstance from '../config/axios';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';

type RootStackParamList = {
  SignIn: undefined;
  AdminTabs: undefined;
};

type AdminReportNavigationProp = StackNavigationProp<RootStackParamList, 'AdminTabs'>;

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  course: string;
  createdAt: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
}

interface Class {
  id: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
  teacherFirstName: string;
  teacherLastName: string;
  totalStudents: number;
  createdAt: string;
}

const AdminReport = () => {
  const navigation = useNavigation<AdminReportNavigationProp>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.navigate('SignIn');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const generateCSV = (data: any[], headers: string[], filename: string) => {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(item => {
      const values = headers.map(header => {
        // Map the header to the correct property name
        const propertyMap: { [key: string]: string } = {
          'First Name': 'firstName',
          'Last Name': 'lastName',
          'Student ID': 'studentId',
          'Email': 'email',
          'Course': 'course',
          'Phone Number': 'phoneNumber',
          'Subject Code': 'subjectCode',
          'Subject Description': 'subjectDescription',
          'Schedule': 'schedule',
          'Teacher': `${item.teacherFirstName} ${item.teacherLastName}`,
          'Total Students': 'totalStudents'
        };

        const propertyName = propertyMap[header];
        if (!propertyName) return '""';

        // Get the value from the item
        let value;
        if (header === 'Teacher') {
          value = `${item.teacherFirstName} ${item.teacherLastName}`;
        } else {
          value = item[propertyName];
        }

        // Handle undefined or null values
        if (value === undefined || value === null) return '""';
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return {
      content: csvRows.join('\n'),
      filename: `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    };
  };

  const sendCSVEmail = async (data: any[], headers: string[], title: string) => {
    try {
      // Log the data to check its structure
      console.log('Data being sent to CSV:', data);
      
      const { content, filename } = generateCSV(data, headers, title);
      
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email service is not available on this device');
        return;
      }

      // Create a temporary file
      const filePath = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await MailComposer.composeAsync({
        subject: `${title} List - ${new Date().toLocaleDateString()}`,
        body: `Please find attached the list of ${title.toLowerCase()}.`,
        recipients: [],
        attachments: [filePath],
      });
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      const [statsResponse, studentsResponse, teachersResponse, classesResponse] = await Promise.all([
        axiosInstance.get('/api/admins/dashboard-stats'),
        axiosInstance.get('/api/admins/students'),
        axiosInstance.get('/api/admins/teachers'),
        axiosInstance.get('/api/admins/classes'),
      ]);

      // Log the responses to check data structure
      console.log('Students data:', studentsResponse.data);
      console.log('Teachers data:', teachersResponse.data);

      setStats(statsResponse.data);
      setStudents(studentsResponse.data);
      setTeachers(teachersResponse.data);
      setClasses(classesResponse.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: handleLogout,
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to fetch data. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => setRefreshing(false),
            },
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const showDirectoryPath = () => {
    const downloadsDir = `${FileSystem.documentDirectory}downloads/`;
    Alert.alert(
      'File Directory',
      `Files are saved to:\n${downloadsDir}`,
      [
        {
          text: 'Copy Path',
          onPress: () => {
            Clipboard.setString(downloadsDir);
            Alert.alert('Success', 'Path copied to clipboard');
          },
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Report</Text>
          <Text style={styles.subtitle}>System Statistics</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.directoryButton}
            onPress={showDirectoryPath}
          >
            <MaterialIcons name="folder" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <AntDesign name="logout" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
              <AntDesign name="user" size={24} color="#DC2626" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalStudents || 0}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => sendCSVEmail(students, ['First Name', 'Last Name', 'Student ID', 'Email', 'Course'], 'Students')}
            >
              <MaterialIcons name="email" size={20} color="#4F46E5" />
              <Text style={styles.downloadText}>Email List</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <AntDesign name="team" size={24} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalTeachers || 0}</Text>
            <Text style={styles.statLabel}>Total Teachers</Text>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => sendCSVEmail(teachers, ['First Name', 'Last Name', 'Email', 'Phone Number'], 'Teachers')}
            >
              <MaterialIcons name="email" size={20} color="#4F46E5" />
              <Text style={styles.downloadText}>Email List</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
              <AntDesign name="book" size={24} color="#059669" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalClasses || 0}</Text>
            <Text style={styles.statLabel}>Active Classes</Text>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => sendCSVEmail(classes, ['Subject Code', 'Subject Description', 'Schedule', 'Teacher', 'Total Students'], 'Classes')}
            >
              <MaterialIcons name="email" size={20} color="#4F46E5" />
              <Text style={styles.downloadText}>Email List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  logoutButton: {
    padding: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  downloadText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directoryButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default AdminReport; 