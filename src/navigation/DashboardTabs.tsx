import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

import { DashboardScreen } from '@/screens/Dashboard/DashboardScreen';
import { ProfileScreen } from '@/screens/Dashboard/ProfileScreen';

const Tab = createBottomTabNavigator();

export const DashboardTabs = () => {
  const { userRole } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Início') iconName = focused ? 'apps' : 'apps-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: Theme.colors.border,
          borderTopWidth: 1,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Início" component={DashboardScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
