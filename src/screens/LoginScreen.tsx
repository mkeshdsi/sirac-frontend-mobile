import React, { useState } from 'react';
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

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: Nav }

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (!res.success) {
        setError('Credenciais inválidas.');
        return;
      }
      navigation.navigate('TokenVerification', { 
        username: username.trim(), 
        maskedDestination: res.maskedDestination 
      });
    } catch (e) {
      setError('Falha ao iniciar sessão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = username.trim().length > 0 && password.length > 0;

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
                source={require('../../logo_png.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.welcomeText}>Bem-vindo de volta</Text>
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
                label="Email ou Telefone"
                placeholder="exemplo@email.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={username}
                onChangeText={setUsername}
                required
                leftIcon={<Ionicons name="person-outline" size={20} color={Theme.colors.textSecondary} />}
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a palavra-passe?</Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <Button 
                title="Iniciar Sessão" 
                onPress={onSubmit} 
                loading={loading}
                disabled={!isFormValid}
                style={[
                  styles.loginButton,
                  !isFormValid && styles.loginButtonDisabled
                ]}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('UserTypeSelection')}>
                <Text style={styles.registerText}>Criar conta</Text>
              </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: Theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Theme.spacing.xl,
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