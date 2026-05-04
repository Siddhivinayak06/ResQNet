import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import RequestHelpScreen from '../screens/emergency/RequestHelpScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import FirstAidGuideScreen from '../screens/firstaid/FirstAidGuideScreen';
import EmergencyContactsScreen from '../screens/profile/EmergencyContactsScreen';
import { colors } from '../theme/colors';

// ─── Param Lists ─────────────────────────────────────────────
type TabParamList = {
  Home: undefined;
  Emergency: undefined;
  Profile: undefined;
};

type StackParamList = {
  MainTabs: undefined;
  RequestHelp: undefined;
  FirstAid: undefined;
  EmergencyContacts: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<StackParamList>();

// ─── Tab Icon ────────────────────────────────────────────────
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const config: Record<string, { icon: string; name: string }> = {
    Home: { icon: '🏠', name: 'Home' },
    Emergency: { icon: '🚨', name: 'Emergency' },
    Profile: { icon: '👤', name: 'Profile' },
  };
  const c = config[label] || { icon: '•', name: label };

  return (
    <View style={tabStyles.container} accessibilityLabel={`${c.name} tab`}>
      <Text style={{ fontSize: 22 }}>{c.icon}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{c.name}</Text>
      {focused && <View style={tabStyles.indicator} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  label: { fontSize: 10, marginTop: 3, fontWeight: '600', color: colors.dark500 },
  labelFocused: { color: colors.primary400 },
  indicator: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary500, marginTop: 3,
  },
});

// ─── Bottom Tabs (3 tabs: Home, Emergency, Profile) ──────────
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark900,
          borderTopColor: colors.dark800,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 18,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Emergency">{(props: any) => <RequestHelpScreen {...props} />}</Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

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
      <Stack.Screen name="MainTabs" component={BottomTabs} />
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
