import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

export const ProfileScreen = () => {
  const { userData, signOut } = useAuth();

  const userContact = userData?.msisdn || userData?.phone_number || userData?.contacto || '';
  const userName = userData?.nome || userData?.name || 'Utilizador';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        
      </View>

      {/* Hero header */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.name}>{userName}</Text>

        {!!userData?.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color={Theme.colors.textSecondary} />
            <Text style={styles.infoText}>{userData.email}</Text>
          </View>
        )}

        {!!userContact && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={Theme.colors.textSecondary} />
            <Text style={styles.infoText}>{userContact}</Text>
          </View>
        )}
      </View>

      {/* Info cards */}
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Theme.colors.primary} />
          <Text style={styles.cardLabel}>Conta ativa</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="person-circle-outline" size={20} color={Theme.colors.primary} />
          <Text style={styles.cardLabel}>Perfil completo</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.75}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={Theme.colors.error} />
          </View>
          <Text style={styles.logoutText}>Terminar Sessão</Text>
          <Ionicons name="chevron-forward" size={16} color={Theme.colors.error} style={{ marginLeft: 'auto' }} />
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

  /* Logo */
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 16,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  logo: {
    width: 140,
    height: 52,
  },

  /* Header / Hero */
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: Theme.spacing.xl,
    backgroundColor: Theme.colors.surface,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  name: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
  },

  /* Mini cards */
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginHorizontal: Theme.spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  cardLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },

  /* Actions */
  actions: {
    marginTop: 24,
    marginHorizontal: Theme.spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.error,
    gap: 12,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    ...Theme.typography.body,
    color: Theme.colors.error,
    fontWeight: '600',
  },
});