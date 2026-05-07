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
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { RootStackParamList } from '@/types';
import { requestPasswordResetPin } from '@/services/auth';

type Nav = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
type AccountType = 'angariador' | 'tvr';

interface Props {
  navigation: Nav;
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('angariador');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await requestPasswordResetPin(accountType, email.trim());
      navigation.navigate('ResetPassword', { email: email.trim(), accountType });
    } catch (e: any) {
      setError(e?.response?.data?.msg || 'Não foi possível enviar o PIN.');
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
            <Text style={styles.headerTitle}>Recuperar password</Text>
            <Text style={styles.headerSubtitle}>Receba um PIN por SMS para definir uma nova palavra-passe</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Tipo de Conta</Text>

          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentItem, accountType === 'angariador' && styles.segmentItemActive]}
              onPress={() => setAccountType('angariador')}
            >
              <Ionicons name="person-outline" size={16} color={accountType === 'angariador' ? '#fff' : Theme.colors.textSecondary} />
              <Text style={[styles.segmentText, accountType === 'angariador' && styles.segmentTextActive]}>Angariador</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentItem, accountType === 'tvr' && styles.segmentItemActive]}
              onPress={() => setAccountType('tvr')}
            >
              <Ionicons name="briefcase-outline" size={16} color={accountType === 'tvr' ? '#fff' : Theme.colors.textSecondary} />
              <Text style={[styles.segmentText, accountType === 'tvr' && styles.segmentTextActive]}>TVR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notice}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Theme.colors.primary} />
            <Text style={styles.noticeText}>O PIN será enviado para o número associado ao email informado.</Text>
          </View>

          <Input
            label="Email"
            placeholder="exemplo@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Ionicons name="mail-outline" size={20} color={Theme.colors.textSecondary} />}
            required
          />

          {!!error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={16} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button title="Enviar PIN" onPress={onSubmit} loading={loading} disabled={!email.trim()} iconName="send-outline" iconPosition="right" style={styles.primaryButton} />
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
  title: { ...Theme.typography.h3, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.md },
  segment: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  segmentItem: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  segmentItemActive: { backgroundColor: Theme.colors.primary },
  segmentText: { color: Theme.colors.textSecondary, fontWeight: '700' },
  segmentTextActive: { color: '#fff' },
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
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
});
