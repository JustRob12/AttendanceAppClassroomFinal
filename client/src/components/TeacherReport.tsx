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
  Dimensions,
} from 'react-native';
import axiosInstance from '../config/axios';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MailComposer from 'expo-mail-composer';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type RootStackParamList = {
  SignIn: undefined;
  TeacherDash: undefined;
};

type TeacherReportNavigationProp = StackNavigationProp<RootStackParamList, 'TeacherDash'>;

interface StudentAttendance {
  studentId: string;
  name: string;
  presentDates: string[];
}

interface AttendanceRecord {
  date: string;
  time: string;
  totalStudents: number;
  presentStudents: number;
  attendancePercentage: number;
  presentStudentDetails: StudentAttendance[];
}

interface AttendanceReport {
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
  totalStudents: number;
  attendanceRecords: AttendanceRecord[];
}

const TeacherReport = () => {
  const navigation = useNavigation<TeacherReportNavigationProp>();
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.navigate('SignIn');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const generateCSVForSubject = (subject: AttendanceReport) => {
    console.log('Generating CSV for subject:', subject.subjectCode);
    console.log('Attendance records:', subject.attendanceRecords);
    
    const headers = ['Student ID', 'Student Name', 'Present Dates', 'Absent Dates'];
    const csvRows = [headers.join(',')];
    
    // Get all dates for the subject
    const allDates = new Set<string>();
    subject.attendanceRecords.forEach(record => {
      allDates.add(record.date);
    });
    console.log('All dates:', Array.from(allDates));
    
    // Track both present and absent dates
    const studentAttendanceMap = new Map<string, {
      name: string;
      presentDates: Set<string>;
      absentDates: Set<string>;
    }>();
    
    subject.attendanceRecords.forEach(record => {
      console.log(`Processing record for date ${record.date}:`, record);
      if (record.presentStudentDetails && Array.isArray(record.presentStudentDetails)) {
        record.presentStudentDetails.forEach(student => {
          console.log(`Processing student ${student.studentId}:`, student);
          if (!studentAttendanceMap.has(student.studentId)) {
            studentAttendanceMap.set(student.studentId, {
              name: student.name,
              presentDates: new Set([record.date]),
              absentDates: new Set([...allDates].filter(date => date !== record.date))
            });
          } else {
            const studentRecord = studentAttendanceMap.get(student.studentId);
            if (studentRecord) {
              studentRecord.presentDates.add(record.date);
              studentRecord.absentDates.delete(record.date);
            }
          }
        });
      } else {
        console.log('No presentStudentDetails found for record:', record);
      }
    });
    
    console.log('Student attendance map:', 
      Array.from(studentAttendanceMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        presentDates: Array.from(data.presentDates),
        absentDates: Array.from(data.absentDates)
      }))
    );
    
    if (studentAttendanceMap.size > 0) {
      studentAttendanceMap.forEach((value, studentId) => {
        const values = [
          `"${studentId}"`,
          `"${value.name}"`,
          `"${Array.from(value.presentDates).sort().join('; ')}"`,
          `"${Array.from(value.absentDates).sort().join('; ')}"`,
        ];
        csvRows.push(values.join(','));
      });
    } else {
      console.log('No student data found for CSV');
      csvRows.push(`"N/A","No student data available","",""`);
    }
    
    const content = csvRows.join('\n');
    console.log('Generated CSV content:', content);
    
    return {
      content,
      filename: `Student_Attendance_${subject.subjectCode}_${new Date().toISOString().split('T')[0]}.csv`
    };
  };

  const saveAndShareCSV = async (subject: AttendanceReport) => {
    try {
      console.log('Starting CSV generation for subject:', subject.subjectCode);
      const { content, filename } = generateCSVForSubject(subject);
      console.log('Generated CSV content:', content);
      
      // Get the app's documents directory
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      console.log('File will be saved at:', fileUri);
      
      // Write the CSV content to a file with UTF-8 BOM for Excel compatibility
      const csvContent = '\ufeff' + content; // Add BOM for Excel
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });
      console.log('File written successfully');

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      console.log('Sharing available:', isSharingAvailable);

      if (isSharingAvailable) {
        Alert.alert(
          'CSV File Created',
          'The attendance report has been generated. What would you like to do?',
          [
            {
              text: 'View/Share',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Share Attendance Report',
                    UTI: 'public.comma-separated-values-text'
                  });
                  console.log('File shared successfully');
                } catch (error) {
                  console.error('Error sharing file:', error);
                  Alert.alert('Error', 'Failed to share the file. Please try again.');
                }
              }
            },
            {
              text: 'Send Email',
              onPress: async () => {
                try {
                  await sendEmailReportForSubject(subject, fileUri);
                  console.log('Email sent successfully');
                } catch (error) {
                  console.error('Error sending email:', error);
                  Alert.alert('Error', 'Failed to send email. Please try again.');
                }
              }
            },
            {
              text: 'Close',
              style: 'cancel'
            }
          ]
        );
      } else {
        // If sharing is not available, just save the file and show the location
        Alert.alert(
          'File Saved',
          `The attendance report has been saved to:\n${fileUri}\n\nWhat would you like to do?`,
          [
            {
              text: 'Send Email',
              onPress: async () => {
                try {
                  await sendEmailReportForSubject(subject, fileUri);
                  console.log('Email sent successfully');
                } catch (error) {
                  console.error('Error sending email:', error);
                  Alert.alert('Error', 'Failed to send email. Please try again.');
                }
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      }

      return fileUri;
    } catch (error) {
      console.error('Error saving CSV:', error);
      Alert.alert('Error', 'Failed to save CSV file. Please try again.');
      return null;
    }
  };

  const sendEmailReportForSubject = async (subject: AttendanceReport, fileUri?: string) => {
    try {
      if (!subject || !subject.attendanceRecords) {
        Alert.alert('Error', 'No attendance data available for this subject');
        return;
      }

      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email service is not available on this device');
        return;
      }

      // If no fileUri is provided, generate a new one
      let attachmentUri = fileUri;
      if (!attachmentUri) {
        const { content, filename } = generateCSVForSubject(subject);
        attachmentUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(attachmentUri, '\ufeff' + content, {
          encoding: FileSystem.EncodingType.UTF8
        });
      }

      await MailComposer.composeAsync({
        subject: `Student Attendance Report - ${subject.subjectCode} - ${new Date().toLocaleDateString()}`,
        body: `Please find attached the student attendance report for ${subject.subjectCode} - ${subject.subjectDescription}\n\nThe report includes:\n- Student ID\n- Student Name\n- Dates student was present\n- Dates student was absent`,
        recipients: [],
        attachments: [attachmentUri]
      });
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/api/teachers/attendance-report');
      console.log('Received attendance data:', JSON.stringify(response.data, null, 2));
      
      // Check if we have the expected data structure
      if (response.data && Array.isArray(response.data)) {
        const dataWithStudents = response.data.map((subject: AttendanceReport) => {
          console.log(`Processing subject ${subject.subjectCode}:`, subject);
          
          // Validate the data structure
          if (!subject.attendanceRecords || !Array.isArray(subject.attendanceRecords)) {
            console.error('Invalid attendance records for subject:', subject.subjectCode);
            return subject;
          }
          
          return {
            ...subject,
            attendanceRecords: subject.attendanceRecords.map((record: AttendanceRecord) => {
              // Log if we're missing student details
              if (!record.presentStudentDetails) {
                console.warn(`Missing student details for date ${record.date} in subject ${subject.subjectCode}`);
              }
              
              return {
                ...record,
                presentStudentDetails: record.presentStudentDetails || []
              };
            })
          };
        });
        setAttendanceData(dataWithStudents);
      } else {
        console.error('Unexpected data format:', response.data);
        Alert.alert('Error', 'Received unexpected data format from server');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: handleLogout }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to fetch attendance data. Please try again.',
          [{ text: 'OK', onPress: () => setRefreshing(false) }]
        );
      }
      setAttendanceData([]);
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

  const getChartData = () => {
    const labels = attendanceData.map(item => item.subjectCode);
    const data = attendanceData.map(item => {
      const totalAttendance = item.attendanceRecords.reduce((sum, record) => sum + record.attendancePercentage, 0);
      return totalAttendance / (item.attendanceRecords.length || 1);
    });

    return {
      labels,
      datasets: [{ data }],
    };
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
          <Text style={styles.title}>Attendance Report</Text>
          <Text style={styles.subtitle}>By Subject</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <AntDesign name="logout" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {attendanceData && attendanceData.length > 0 ? (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Attendance Overview</Text>
              <BarChart
                data={getChartData()}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
            {attendanceData.map((item, index) => (
              <View key={index} style={styles.reportCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.subjectCode}>{item.subjectCode}</Text>
                    <Text style={styles.subjectDescription}>{item.subjectDescription}</Text>
                    <Text style={styles.schedule}>{item.schedule}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.emailButton}
                    onPress={() => saveAndShareCSV(item)}
                  >
                    <MaterialIcons name="email" size={24} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Students</Text>
                    <Text style={styles.statValue}>{item.totalStudents}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Average Attendance</Text>
                    <Text style={[
                      styles.statValue,
                      { color: item.attendanceRecords.length > 0 ? 
                        (item.attendanceRecords.reduce((sum, record) => sum + record.attendancePercentage, 0) / item.attendanceRecords.length >= 70 ? '#059669' : '#DC2626')
                        : '#6B7280'
                      }
                    ]}>
                      {item.attendanceRecords.length > 0 
                        ? `${Math.round(item.attendanceRecords.reduce((sum, record) => sum + record.attendancePercentage, 0) / item.attendanceRecords.length)}%`
                        : 'N/A'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No attendance data available</Text>
          </View>
        )}
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
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
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
  logoutButton: {
    padding: 8,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subjectCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  subjectDescription: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 4,
  },
  schedule: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emailButton: {
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TeacherReport; 