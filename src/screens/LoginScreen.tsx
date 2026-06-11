import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { login } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import { deleteItem, getItem, setItem } from '@/config/api';

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: Nav }

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const { signIn } = useAuth();
  const normalizedIdentifier = identifier.trim();
  const normalizedContact = normalizedIdentifier.replace(/\D/g, '');
  const isEmailIdentifier = normalizedIdentifier.includes('@');
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier.toLowerCase());
  const isTmcelContact = /^(82|83)\d{7}$/.test(normalizedContact);
  const isIdentifierValid = isEmailIdentifier ? isEmailValid : isTmcelContact;

  useEffect(() => {
    const loadSavedCredentials = async () => {
      const saved = await getItem('sirac_saved_login');
      if (!saved) return;

      try {
        const credentials = JSON.parse(saved);
        setIdentifier(credentials.identifier || '');
        setPassword(credentials.password || '');
        setRememberPassword(true);
      } catch {
        await deleteItem('sirac_saved_login');
      }
    };

    loadSavedCredentials();
  }, []);

  const onSubmit = async () => {
    setError('');

    if (!isIdentifierValid) {
      setError('Colaborador deve usar email. Angariador ou TVR deve usar contacto Tmcel: 82/83 + 7 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const loginIdentifier = isEmailIdentifier ? normalizedIdentifier.toLowerCase() : normalizedContact;
      const res = await login(loginIdentifier, password);
      if (res.forcePasswordChange) {
        navigation.navigate('FirstLoginPasswordChange', {
          oldPassword: password,
          angariadorId: res.forcePasswordChange.angariador_id,
          tvrId: res.forcePasswordChange.tvr_id,
          msisdn: res.forcePasswordChange.msisdn,
          accountType: res.forcePasswordChange.tvr_id ? 'tvr' : 'angariador',
        });
        return;
      }

      if (!res.success || !res.token) {
        setError(res.message || 'Falha ao iniciar sessão.');
        return;
      }
      
      const roleMatch = (res.type || res.user?.type || res.user?.usertype || 'user') as 'user' | 'angariador' | 'tvr';
      await signIn(roleMatch, res.user);

      if (rememberPassword) {
        await setItem('sirac_saved_login', JSON.stringify({
          identifier: isEmailIdentifier ? normalizedIdentifier.toLowerCase() : normalizedContact,
          password,
        }));
      } else {
        await deleteItem('sirac_saved_login');
      }
      
      // O RootNavigator vai reagir ao signIn e desenhar as BottomTabs (Dashboard)
    } catch (e) {
      setError('Falha ao iniciar sessão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = isIdentifierValid && password.length > 0;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[Theme.colors.secondary, Theme.colors.primary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../AdminLTELogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.welcomeText}>Bem-vindo</Text>
            <Text style={styles.subtitleText}>Inicie sessão para continuar</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContent}>
            <Text style={styles.title}>Iniciar Sessão</Text>
            
            <View style={styles.inputContainer}>
              <Input
                label="Email ou contacto"
                placeholder="Colaborador: email | TVR/Angariador: 82xxxxxxx"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={identifier}
                onChangeText={setIdentifier}
                required
                leftIcon={<Ionicons name={isEmailIdentifier ? 'mail-outline' : 'person-outline'} size={20} color={Theme.colors.textSecondary} />}
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Palavra-passe"
                placeholder="Digite sua palavra-passe"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                required
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Theme.colors.textSecondary} />}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={Theme.colors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {!!error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color={Theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.loginOptions}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberPassword((value) => !value)}
                activeOpacity={0.75}
              >
                <View style={[styles.checkbox, rememberPassword && styles.checkboxChecked]}>
                  {rememberPassword && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={styles.rememberText}>Guardar senha</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>Esqueci a palavra-passe</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <Button 
                title="Iniciar Sessão" 
                onPress={onSubmit} 
                loading={loading}
                disabled={!isFormValid}
                iconName="log-in-outline"
                iconPosition="right"
                style={[
                  styles.loginButton,
                  !isFormValid && styles.loginButtonDisabled
                ]}
              />
            </View>

           
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 56,
    paddingBottom: 40,
    paddingHorizontal: Theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  logo: {
    width: 76,
    height: 76,
  },
  welcomeText: {
    ...Theme.typography.h1,
    color: 'white',
    marginBottom: Theme.spacing.xs,
  },
  subtitleText: {
    ...Theme.typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  formContent: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
  },
  title: {
    ...Theme.typography.h2,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Theme.spacing.lg,
  },
  eyeIcon: {
    padding: Theme.spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorLight || 'rgba(244, 67, 54, 0.1)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    ...Theme.typography.caption,
    color: Theme.colors.error,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  loginOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Theme.spacing.xl,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: Theme.colors.surface,
  },
  checkboxChecked: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  rememberText: {
    ...Theme.typography.caption,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  forgotPassword: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    ...Theme.typography.caption,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: Theme.spacing.xl,
  },
  loginButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.md,
    elevation: 3,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    backgroundColor: Theme.colors.disabled || Theme.colors.textSecondary,
    elevation: 0,
    shadowOpacity: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  footerText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  registerText: {
    ...Theme.typography.body,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
});
