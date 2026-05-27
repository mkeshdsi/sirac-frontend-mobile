import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { RootStackParamList } from '@/types';
import { updateAngariadorFirstLoginPassword } from '@/services/auth';

type Nav = StackNavigationProp<RootStackParamList, 'FirstLoginPasswordChange'>;
type Route = RouteProp<RootStackParamList, 'FirstLoginPasswordChange'>;

interface Props {
  navigation: Nav;
  route: Route;
}

export const FirstLoginPasswordChangeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { oldPassword, msisdn } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const onSubmit = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await updateAngariadorFirstLoginPassword({
        msisdn,
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSuccess('Password atualizada. Faça login com a nova palavra-passe.');
      setTimeout(() => navigation.navigate('Login'), 900);
    } catch (e: any) {
      setError(e?.response?.data?.msg || 'Não foi possível atualizar a password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient colors={[Theme.colors.secondary, Theme.colors.primary]} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image source={require('../../AdminLTELogo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.headerTitle}>Alterar password inicial</Text>
            <Text style={styles.headerSubtitle}>Defina a nova palavra-passe para concluir o primeiro acesso</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={18} color={Theme.colors.primary} />
            <Text style={styles.noticeText}>Depois de guardar, volte a iniciar sessão com a nova palavra-passe.</Text>
          </View>

          <Text style={styles.title}>Primeiro Login</Text>

          <Input label="Contacto Tmcel" value={msisdn?.replace(/^258/, '') || ''} editable={false} leftIcon={<Ionicons name="call-outline" size={20} color={Theme.colors.textSecondary} />} />
          <Input
            label="Nova palavra-passe"
            placeholder="Digite a nova palavra-passe"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Theme.colors.textSecondary} />}
            required
          />
          <Input
            label="Confirmar palavra-passe"
            placeholder="Confirme a nova palavra-passe"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Theme.colors.textSecondary} />}
            required
          />

          {!!error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={16} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!!success && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Theme.colors.success} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          <Button title="Atualizar password" onPress={onSubmit} loading={loading} disabled={!isValid} iconName="checkmark-circle-outline" iconPosition="right" style={styles.primaryButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    paddingTop: Platform.OS === 'ios' ? 72 : 48,
    paddingBottom: 34,
    paddingHorizontal: Theme.spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 32,
    left: Theme.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerContent: { alignItems: 'center' },
  logoContainer: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  logo: { width: 70, height: 70 },
  headerTitle: { ...Theme.typography.h2, color: '#fff', textAlign: 'center' },
  headerSubtitle: { ...Theme.typography.body2, color: 'rgba(255,255,255,0.82)', textAlign: 'center', marginTop: Theme.spacing.xs, lineHeight: 20 },
  formContainer: { flex: 1, backgroundColor: Theme.colors.background },
  formContent: { padding: Theme.spacing.lg, paddingTop: Theme.spacing.xl },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Theme.colors.primary}12`,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    gap: 8,
  },
  noticeText: { ...Theme.typography.caption, color: Theme.colors.primary, flex: 1, lineHeight: 18, fontWeight: '600' },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.lg, textAlign: 'center' },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorLight || 'rgba(244, 67, 54, 0.1)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  errorText: { ...Theme.typography.caption, color: Theme.colors.error, flex: 1 },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Theme.colors.success}12`,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  successText: { ...Theme.typography.caption, color: Theme.colors.success, flex: 1, fontWeight: '600' },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
});
