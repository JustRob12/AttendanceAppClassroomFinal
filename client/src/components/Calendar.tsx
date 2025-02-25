import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { styled } from "nativewind";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';
import LoadingScreen from './LoadingScreen';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchable = styled(TouchableOpacity);

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
    // Format the date to match MySQL date format (YYYY-MM-DD)
    const formattedDate = dateString.split('T')[0];
    const attendance = attendanceData.find(a => {
      // Format both dates to handle any timezone issues
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
        <StyledView key={`empty-${i}`} className="w-11 h-11" />
      );
    }

    // Days of the month
    for (let day = 1; day <= days; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const status = getAttendanceStatus(dateString);
      
      let dayStyle = "bg-white";
      let textStyle = "text-gray-700";
      
      if (status === 'present') {
        dayStyle = "bg-green-500";
        textStyle = "text-white font-medium";
      } else if (status === 'absent') {
        dayStyle = "bg-red-500";
        textStyle = "text-white font-medium";
      }

      week.push(
        <StyledView 
          key={day} 
          className={`w-11 h-11 items-center justify-center rounded-full ${dayStyle}`}
        >
          <StyledText className={`text-sm ${textStyle}`}>
            {day}
          </StyledText>
        </StyledView>
      );

      if (week.length === 7) {
        weeks.push(
          <StyledView key={weeks.length} className="flex-row justify-around mb-2">
            {week}
          </StyledView>
        );
        week = [];
      }
    }

    // Fill remaining days in last week
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(
          <StyledView key={`empty-end-${week.length}`} className="w-11 h-11" />
        );
      }
      weeks.push(
        <StyledView key={weeks.length} className="flex-row justify-around mb-2">
          {week}
        </StyledView>
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
      <StyledView className="flex-1 bg-black/50 justify-center items-center">
        <StyledView 
          className="bg-white rounded-xl w-11/12 max-h-[90%]"
          style={{ maxHeight: screenHeight * 0.9 }}
        >
          {/* Header */}
          <StyledView className="p-4 border-b border-gray-200">
            <StyledText className="text-xl font-bold text-gray-900 text-center">
              {subjectName}
            </StyledText>
          </StyledView>

          <StyledView className="p-4">
            {/* Month Navigation */}
            <StyledView className="flex-row justify-between items-center mb-4">
              <StyledTouchable 
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
                onPress={() => changeMonth(-1)}
              >
                <StyledText className="text-gray-600 text-xl">←</StyledText>
              </StyledTouchable>
              <StyledText className="text-lg font-semibold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </StyledText>
              <StyledTouchable 
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
                onPress={() => changeMonth(1)}
              >
                <StyledText className="text-gray-600 text-xl">→</StyledText>
              </StyledTouchable>
            </StyledView>

            {/* Weekday Headers */}
            <StyledView className="flex-row justify-around mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <StyledText key={day} className="w-11 text-center text-gray-500 text-sm font-medium">
                  {day}
                </StyledText>
              ))}
            </StyledView>

            {/* Calendar Grid */}
            {loading ? (
              <StyledView className="h-48">
                <LoadingScreen message="Loading attendance..." />
              </StyledView>
            ) : (
              renderCalendar()
            )}

            {/* Legend */}
            <StyledView className="flex-row justify-center mt-4 space-x-6">
              <StyledView className="flex-row items-center">
                <StyledView className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                <StyledText className="text-sm text-gray-600">Present</StyledText>
              </StyledView>
              <StyledView className="flex-row items-center">
                <StyledView className="w-4 h-4 rounded-full bg-red-500 mr-2" />
                <StyledText className="text-sm text-gray-600">Absent</StyledText>
              </StyledView>
            </StyledView>
          </StyledView>

          {/* Close Button */}
          <StyledView className="p-4 border-t border-gray-200">
            <StyledTouchable 
              className="bg-gray-900 py-3 rounded-lg"
              onPress={onClose}
            >
              <StyledText className="text-center text-white font-semibold">Close</StyledText>
            </StyledTouchable>
          </StyledView>
        </StyledView>
      </StyledView>
    </Modal>
  );
};

export default Calendar; 