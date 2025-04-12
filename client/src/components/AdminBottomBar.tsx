import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AntDesign } from '@expo/vector-icons';

type RootStackParamList = {
  AdminDashboard: undefined;
  AddUser: undefined;
  AdminReport: undefined;
  ProfileAdmin: undefined;
};

type AdminBottomBarNavigationProp = StackNavigationProp<RootStackParamList>;

const AdminBottomBar: React.FC = () => {
  const navigation = useNavigation<AdminBottomBarNavigationProp>();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tab}
        onPress={() => navigation.navigate('AdminDashboard')}
      >
        <AntDesign name="home" size={24} color="#000" />
        <Text style={styles.tabText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab}
        onPress={() => navigation.navigate('AddUser')}
      >
        <AntDesign name="adduser" size={24} color="#000" />
        <Text style={styles.tabText}>Add User</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab}
        onPress={() => navigation.navigate('AdminReport')}
      >
        <AntDesign name="barschart" size={24} color="#000" />
        <Text style={styles.tabText}>Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab}
        onPress={() => navigation.navigate('ProfileAdmin')}
      >
        <AntDesign name="user" size={24} color="#000" />
        <Text style={styles.tabText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    color: '#000',
    marginTop: 4,
  },
});

export default AdminBottomBar; 