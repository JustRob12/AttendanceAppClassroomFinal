import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';
import LoadingScreen from './LoadingScreen';
import { AntDesign } from '@expo/vector-icons';

interface CalendarProps {
  classId: number;
  visible: boolean;
  subjectName: string;
  onClose: () => void;
}

interface AttendanceData {
  date: string;
  status: 'present' | 'absent';
}

const screenHeight = Dimensions.get('window').height;

const Calendar: React.FC<CalendarProps> = ({ classId, visible, subjectName, onClose }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchAttendanceData();
    }
  }, [visible, classId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${env.apiUrl}/api/attendance/student/class/${classId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
 
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAttendanceStatus = (dateString: string) => {
    const formattedDate = dateString.split('T')[0];
    const attendance = attendanceData.find(a => {
      const attendanceDate = new Date(a.date).toISOString().split('T')[0];
      return attendanceDate === formattedDate;
    });
    return attendance?.status;
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const weeks = [];
    let week = [];

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      week.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }

    // Days of the month
    for (let day = 1; day <= days; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const status = getAttendanceStatus(dateString);
      
      let cellStyle = [styles.dayCell];
      let textStyle = [styles.dayText];
      
      if (status === 'present') {
        cellStyle.push({
          ...styles.dayCell,
          ...styles.presentCell
        });
        textStyle.push({
          ...styles.dayText,
          ...styles.presentText
        });
      } else if (status === 'absent') {
        cellStyle.push({
          ...styles.dayCell,
          ...styles.absentCell
        });
        textStyle.push({
          ...styles.dayText,
          ...styles.absentText
        });
      }

      week.push(
        <View key={day} style={cellStyle}>
          <Text style={textStyle}>{day}</Text>
        </View>
      );

      if (week.length === 7) {
        weeks.push(
          <View key={weeks.length} style={styles.weekRow}>
            {week}
          </View>
        );
        week = [];
      }
    }

    // Fill remaining days in last week
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(
          <View key={`empty-end-${week.length}`} style={styles.dayCell} />
        );
      }
      weeks.push(
        <View key={weeks.length} style={styles.weekRow}>
          {week}
        </View>
      );
    }

    return weeks;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{subjectName}</Text>
          </View>

          <View style={styles.calendarContainer}>
            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity 
                style={styles.navigationButton}
                onPress={() => changeMonth(-1)}
              >
                <AntDesign name="left" size={20} color="#4F46E5" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity 
                style={styles.navigationButton}
                onPress={() => changeMonth(1)}
              >
                <AntDesign name="right" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdayHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <LoadingScreen message="Loading attendance..." />
              </View>
            ) : (
              renderCalendar()
            )}

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.presentDot]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.absentDot]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
            </View>
          </View>

          {/* Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: screenHeight * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  calendarContainer: {
    padding: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navigationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekdayText: {
    width: 44,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayCell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  dayText: {
    fontSize: 16,
    color: '#111827',
  },
  presentCell: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  presentText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  absentCell: {
    backgroundColor: '#EF4444',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  absentText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    height: 300,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  presentDot: {
    backgroundColor: '#10B981',
  },
  absentDot: {
    backgroundColor: '#EF4444',
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  closeButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Calendar; 