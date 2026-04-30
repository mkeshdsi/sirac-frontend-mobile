import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen = () => {
  const { userData, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Theme.colors.primary} />
        </View>
        <Text style={styles.name}>{userData?.name || 'Utilizador'}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
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
});
