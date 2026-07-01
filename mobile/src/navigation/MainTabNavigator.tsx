import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import RequestHelpScreen from '../screens/emergency/RequestHelpScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

type TabParamList = {
  Home: undefined;
  Emergency: undefined;
  Civic: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const config: Record<string, { icon: string; name: string }> = {
    Home: { icon: '🏠', name: 'Home' },
    Emergency: { icon: '🚨', name: 'Emergency' },
    Civic: { icon: '🏙️', name: 'Civic' },
    Profile: { icon: '👤', name: 'Profile' },
  };
  const c = config[label] || { icon: '•', name: label };

  return (
    <View style={styles.container} accessibilityLabel={`${c.name} tab`}>
      <Text style={{ fontSize: 22 }}>{c.icon}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{c.name}</Text>
      {focused && <View style={styles.indicator} />}
    </View>
  );
}

export default function MainTabNavigator() {
  const { user } = useAuth();
  
  // Conditionally hide Emergency reporting for volunteers
  const isVolunteer = user?.role === 'volunteer';

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
      <Tab.Screen name="Civic" component={require('../screens/civic/CivicIssueFeedScreen').default} />
      {!isVolunteer && <Tab.Screen name="Emergency">{(props: any) => <RequestHelpScreen {...props} />}</Tab.Screen>}
      {/* TODO: Add Missions / Live Map screens for Volunteer */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  label: { fontSize: 10, marginTop: 3, fontWeight: '600', color: colors.dark500 },
  labelFocused: { color: colors.primary400 },
  indicator: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary500, marginTop: 3,
  },
});
