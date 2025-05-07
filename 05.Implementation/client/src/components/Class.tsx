import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

interface ClassProps {
  visible: boolean;
  onClose: () => void;
  onClassAdded: () => void;
  classToEdit?: ClassData;
}

interface ClassData {
  id?: number;
  subjectCode: string;
  subjectDescription: string;
  schedule: string;
}

const Class: React.FC<ClassProps> = ({ visible, onClose, onClassAdded, classToEdit }) => {
  const [formData, setFormData] = useState<ClassData>({
    subjectCode: '',
    subjectDescription: '',
    schedule: ''
  });

  const isEditMode = !!classToEdit;

  // If a class is provided for editing, populate the form with its data
  useEffect(() => {
    if (classToEdit) {
      setFormData({
        id: classToEdit.id,
        subjectCode: classToEdit.subjectCode,
        subjectDescription: classToEdit.subjectDescription,
        schedule: classToEdit.schedule
      });
    } else {
      // Reset form when not in edit mode
      setFormData({
        subjectCode: '',
        subjectDescription: '',
        schedule: ''
      });
    }
  }, [classToEdit, visible]);

  const handleSubmit = async () => {
    try {
      // Validate inputs
      if (!formData.subjectCode || !formData.subjectDescription || !formData.schedule) {
        Alert.alert('Error', 'All fields are required');
        return;
      }

      const token = await AsyncStorage.getItem('token');

      let response;
      if (isEditMode && formData.id) {
        // Update existing class
        response = await axios.put(
          `${env.apiUrl}/api/classes/${formData.id}`,
          {
            subjectCode: formData.subjectCode,
            subjectDescription: formData.subjectDescription,
            schedule: formData.schedule
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          Alert.alert('Success', 'Class updated successfully');
        }
      } else {
        // Add new class
        response = await axios.post(
          `${env.apiUrl}/api/classes`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          Alert.alert('Success', 'Class added successfully');
        }
      }

      // Reset form and close modal
      setFormData({ subjectCode: '', subjectDescription: '', schedule: '' });
      onClassAdded(); // Refresh the class list
      onClose(); // Close the modal
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} class:`, err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} class`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.title}>{isEditMode ? 'Edit Class' : 'Add New Class'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Subject Code"
              value={formData.subjectCode}
              onChangeText={(text) => setFormData({ ...formData, subjectCode: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Subject Description"
              value={formData.subjectDescription}
              onChangeText={(text) => setFormData({ ...formData, subjectDescription: text })}
              multiline
              numberOfLines={4}
            />

            <TextInput
              style={styles.input}
              placeholder="Schedule (e.g., MWF 9:00-10:30 AM)"
              value={formData.schedule}
              onChangeText={(text) => setFormData({ ...formData, schedule: text })}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.buttonText}>{isEditMode ? 'Update Class' : 'Add Class'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default Class; 