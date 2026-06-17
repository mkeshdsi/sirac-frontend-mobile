import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

import { DashboardScreen } from '@/screens/Dashboard/DashboardScreen';
import { OverviewScreen } from '@/screens/Dashboard/OverviewScreen';
import { ProfileScreen } from '@/screens/Dashboard/ProfileScreen';

const Tab = createBottomTabNavigator();

export const DashboardTabs = () => {
  const { userRole, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Dashboard') iconName = focused ? 'apps' : 'apps-outline';
            else if (route.name === 'Visão') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
            else if (route.name === 'Sair') iconName = focused ? 'log-out' : 'log-out-outline';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Theme.colors.primary,
          tabBarInactiveTintColor: Theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: Theme.colors.border,
            borderTopWidth: 1,
            elevation: 0,
            height: 60 + Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0),
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8),
            paddingTop: 8,
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Visão" component={OverviewScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
        <Tab.Screen 
          name="Sair" 
          component={View} 
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowLogoutModal(true);
            },
          }}
        />
      </Tab.Navigator>

      {/* Modal de Sair Customizado */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalContentCentered}>
              <View style={[styles.modalIconContainer, { backgroundColor: '#fff0f0' }]}>
                <Ionicons name="log-out" size={56} color={Theme.colors.error || '#f44336'} />
              </View>
              <Text style={styles.modalTitle}>Sair da Conta</Text>
              <Text style={styles.modalMessage}>
                Tem certeza que deseja sair? Você precisará entrar novamente para acessar seus dados.
              </Text>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setShowLogoutModal(false);
                    signOut();
                  }}
                >
                  <Text style={styles.modalButtonPrimaryText}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContentCentered: {
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...Theme.typography.h2,
    color: Theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalMessage: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  modalButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Theme.colors.error || '#f44336',
  },
  modalButtonSecondary: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonPrimaryText: {
    ...Theme.typography.h4,
    color: 'white',
    fontWeight: 'bold',
  },
  modalButtonSecondaryText: {
    ...Theme.typography.h4,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
});
