import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components';
import { changeMyTvrPassword, updateMyAngariadorPassword } from '@/services/apiResources';

export const ProfileScreen = () => {
  const { userRole, userData, signOut } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const userContact = userData?.msisdn || userData?.phone_number || userData?.contacto || '';
  const userName = userData?.nome || userData?.name || 'Utilizador';
  const roleLabel = userRole === 'tvr' ? 'Técnico de Vendas' : userRole === 'angariador' ? 'Angariador' : 'Utilizador';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const canChangePassword = userRole === 'angariador' || userRole === 'tvr';
  const profileFields = [
    { label: 'Nome completo', value: userName, icon: 'person-outline' },
    { label: 'Perfil', value: roleLabel, icon: 'shield-checkmark-outline' },
    { label: 'Email', value: userData?.email, icon: 'mail-outline' },
    { label: 'Contacto', value: userContact, icon: 'call-outline' },
    { label: 'BI', value: userData?.bi || userData?.documento || userData?.numero_documento, icon: 'id-card-outline' },
    { label: 'NUIT', value: userData?.nuit, icon: 'document-text-outline' },
    { label: 'Estado', value: userData?.is_active === false ? 'Inativo' : 'Ativo', icon: 'checkmark-circle-outline' },
  ].filter((item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== '');

  const resetPasswordForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const onChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('As palavras-passe não coincidem.');
      return;
    }

    setPasswordLoading(true);
    try {
      if (userRole === 'angariador') {
        await updateMyAngariadorPassword({
          email: userData?.email,
          old_password: oldPassword,
          new_password: newPassword,
        });
      } else if (userRole === 'tvr') {
        await changeMyTvrPassword({
          old_password: oldPassword,
          new_password: newPassword,
        });
      }
      setPasswordSuccess('Password atualizada com sucesso.');
      setTimeout(() => {
        setShowPasswordModal(false);
        resetPasswordForm();
      }, 900);
    } catch (e: any) {
      setPasswordError(e?.response?.data?.msg || 'Não foi possível atualizar a password.');
    } finally {
      setPasswordLoading(false);
    }
  };

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
        <TouchableOpacity style={[styles.card, styles.cardTouchable]} onPress={() => setShowProfileModal(true)} activeOpacity={0.75}>
          <Ionicons name="person-circle-outline" size={20} color={Theme.colors.primary} />
          <Text style={styles.cardLabel}>Perfil completo</Text>
          <Ionicons name="chevron-forward" size={14} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {canChangePassword && (
          <TouchableOpacity style={styles.passwordBtn} onPress={() => setShowPasswordModal(true)} activeOpacity={0.75}>
            <View style={styles.passwordIcon}>
              <Ionicons name="key-outline" size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.passwordText}>Alterar Password</Text>
            <Ionicons name="chevron-forward" size={16} color={Theme.colors.primary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.75}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={Theme.colors.error} />
          </View>
          <Text style={styles.logoutText}>Terminar Sessão</Text>
          <Ionicons name="chevron-forward" size={16} color={Theme.colors.error} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          resetPasswordForm();
        }}
      >
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar Password</Text>
            <Text style={styles.modalSubtitle}>Informe a password atual e defina uma nova.</Text>

            <Input label="Password atual" secureTextEntry value={oldPassword} onChangeText={setOldPassword} required />
            <Input label="Nova password" secureTextEntry value={newPassword} onChangeText={setNewPassword} required />
            <Input label="Confirmar nova password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} required />

            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            {!!passwordSuccess && <Text style={styles.successText}>{passwordSuccess}</Text>}

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="outline"
                style={styles.modalActionBtn}
                onPress={() => {
                  setShowPasswordModal(false);
                  resetPasswordForm();
                }}
              />
              <Button
                title="Guardar"
                style={styles.modalActionBtn}
                loading={passwordLoading}
                disabled={!oldPassword || !newPassword || newPassword !== confirmPassword}
                onPress={onChangePassword}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.profileModalCard}>
            <View style={styles.profileModalHeader}>
              <View style={styles.profileModalAvatar}>
                <Text style={styles.profileModalInitials}>{initials}</Text>
              </View>
              <View style={styles.profileModalTitleWrap}>
                <Text style={styles.profileModalTitle}>{userName}</Text>
                <Text style={styles.profileModalSubtitle}>{roleLabel}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowProfileModal(false)} activeOpacity={0.75}>
                <Ionicons name="close" size={20} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.profileDetails} showsVerticalScrollIndicator={false}>
              {profileFields.map((item) => (
                <View key={item.label} style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={Theme.colors.primary} />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{String(item.value)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.profileModalButton} onPress={() => setShowProfileModal(false)} activeOpacity={0.8}>
              <Text style={styles.profileModalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cardTouchable: {
    position: 'relative',
  },

  /* Actions */
  actions: {
    marginTop: 24,
    marginHorizontal: Theme.spacing.lg,
    gap: 12,
  },
  passwordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.primary,
    gap: 12,
  },
  passwordIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordText: {
    ...Theme.typography.body,
    color: Theme.colors.primary,
    fontWeight: '600',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 22,
    padding: Theme.spacing.lg,
  },
  modalTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Theme.spacing.sm,
  },
  modalActionBtn: {
    flex: 1,
  },
  errorText: {
    color: Theme.colors.error,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  successText: {
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    fontWeight: '600',
  },
  profileModalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 22,
    padding: Theme.spacing.lg,
    maxHeight: '82%',
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    gap: 12,
  },
  profileModalAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileModalTitleWrap: {
    flex: 1,
  },
  profileModalTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.textPrimary,
  },
  profileModalSubtitle: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    marginBottom: Theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
    gap: 12,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...Theme.typography.body,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  profileModalButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  profileModalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
