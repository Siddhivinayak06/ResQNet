import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import RequestHelpScreen from '../screens/emergency/RequestHelpScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import FirstAidGuideScreen from '../screens/firstaid/FirstAidGuideScreen';
import EmergencyContactsScreen from '../screens/profile/EmergencyContactsScreen';
// Use MainTabNavigator for bottom tabs
import { colors } from '../theme/colors';

type StackParamList = {
  MainTabs: undefined;
  RequestHelp: undefined;
  ReportCivicIssue: undefined;
  FirstAid: undefined;
  EmergencyContacts: undefined;
};

const Stack = createNativeStackNavigator<StackParamList>();
import MainTabNavigator from './MainTabNavigator';

// ─── Shared header style ─────────────────────────────────────
const headerConfig = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.dark900 },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: 'bold' as const },
};

// ─── Root Stack ──────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark950 },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="RequestHelp"
        component={RequestHelpScreen}
        options={{
          ...headerConfig,
          headerTitle: 'Report Emergency',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ReportCivicIssue"
        component={require('../screens/civic/ReportCivicIssueScreen').default}
        options={{
          ...headerConfig,
          headerTitle: 'Report Civic Issue',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="FirstAid"
        component={FirstAidGuideScreen}
        options={{ ...headerConfig, headerTitle: 'First Aid Guide' }}
      />
      <Stack.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
        options={{ ...headerConfig, headerTitle: 'Emergency Contacts' }}
      />
    </Stack.Navigator>
  );
}
