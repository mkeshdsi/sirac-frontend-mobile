import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { verifyToken } from '@/services/auth';

 type Nav = StackNavigationProp<RootStackParamList, 'TokenVerification'>;
 type Route = RouteProp<RootStackParamList, 'TokenVerification'>;
 interface Props { navigation: Nav; route: Route }

export const TokenVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { username, maskedDestination } = route.params;
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await verifyToken(username, token.trim());
      if (!res.success) {
        setError('Token inválido. Verifique e tente novamente.');
        return;
      }
      // Após sucesso, navegar para o fluxo existente (ex.: Welcome ou Dashboard futuramente)
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } catch (e) {
      setError('Falha ao validar o token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificação de Token</Text>
      <Text style={styles.subtitle}>Enviámos um código de 6 dígitos para: {maskedDestination}</Text>
      <Input
        label="Token"
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={token}
        onChangeText={setToken}
        required
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button title="Validar e Entrar" onPress={onSubmit} loading={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.lg,
  },
  title: {
    ...Theme.typography.h2,
    marginBottom: Theme.spacing.sm,
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    ...Theme.typography.body2,
    marginBottom: Theme.spacing.lg,
    color: Theme.colors.textSecondary,
  },
  error: {
    ...Theme.typography.caption,
    color: Theme.colors.error,
    marginBottom: Theme.spacing.md,
  },
});
