import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';

type Nav = StackNavigationProp<RootStackParamList, 'Success'>;

type Route = RouteProp<RootStackParamList, 'Success'>;

interface Props { navigation: Nav; route: Route }

export const SuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { registrationId } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <Card>
        <Text style={styles.title}>Cadastro submetido com sucesso!</Text>
        <Text style={styles.subtitle}>ID de registo</Text>
        <Text style={styles.code}>{registrationId}</Text>
        <Text style={styles.info}>
          Receberá notificações sobre o estado do seu cadastro. Pode fechar esta janela ou voltar ao início.
        </Text>
        <View style={styles.actions}>
          <Button title="Início" onPress={() => navigation.popToTop()} />
        </View>
      </Card>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg, justifyContent: 'center' },
  title: { ...Theme.typography.h2, color: Theme.colors.primary, marginBottom: Theme.spacing.sm, textAlign: 'center' },
  subtitle: { ...Theme.typography.body2, color: Theme.colors.textSecondary, textAlign: 'center' },
  code: { ...Theme.typography.h1, color: Theme.colors.textPrimary, textAlign: 'center', marginVertical: Theme.spacing.md },
  info: { ...Theme.typography.body2, color: Theme.colors.textSecondary, textAlign: 'center' },
  actions: { marginTop: Theme.spacing.lg },
});
