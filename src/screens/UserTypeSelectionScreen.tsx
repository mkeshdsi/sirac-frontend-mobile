import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, UserType } from '@/types';

type Nav = StackNavigationProp<RootStackParamList, 'UserTypeSelection'>;

interface Props { navigation: Nav }

export const UserTypeSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const goNext = (userType: UserType) => {
    navigation.navigate('PersonalDataForm', { userType });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecione o seu perfil</Text>
        <Text style={styles.subtitle}>Escolha como pretende fazer o cadastro</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Sou Comerciante" onPress={() => goNext('Comerciante')} />
        <Button title="Sou Técnico Comercial" variant="secondary" onPress={() => goNext('TecnicoComercial')} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  header: { marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.lg },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body2, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  actions: { gap: Theme.spacing.md },
});
