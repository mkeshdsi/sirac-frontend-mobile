import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

import { Image } from 'react-native';

export const ProfileScreen = () => {
  const { userData, signOut } = useAuth();

  const userContact = userData?.msisdn || userData?.phone_number || userData?.contacto || '';

  return (
    <View style={styles.container}>
      {/* Space with Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../logo_png.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Theme.colors.primary} />
        </View>
        <Text style={styles.name}>{userData?.nome || userData?.name || 'Utilizador'}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
        {!!userContact && (
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color={Theme.colors.textSecondary} />
            <Text style={styles.contactText}>{userContact}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color={Theme.colors.error} />
          <Text style={styles.logoutText}>Terminar Sessão</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  name: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
  },
  email: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  actions: {
    marginTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: 'white',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.error,
  },
  logoutText: {
    ...Theme.typography.body,
    color: Theme.colors.error,
    marginLeft: Theme.spacing.md,
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: Theme.colors.surface,
  },
  logo: {
    width: 150,
    height: 60,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  contactText: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
});
