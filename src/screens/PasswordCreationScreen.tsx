import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, UserType } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

type Nav = StackNavigationProp<RootStackParamList, 'PasswordCreation'>;

type Route = RouteProp<RootStackParamList, 'PasswordCreation'>;

interface FormData {
  password: string;
  confirmPassword: string;
}

const schema = yup.object({
  password: yup.string().required('Palavra-passe é obrigatória').min(6, 'Mínimo 6 caracteres'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'As palavras-passe não coincidem')
    .required('Confirmação é obrigatória'),
});

interface Props { navigation: Nav; route: Route }

export const PasswordCreationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userType, personalData } = route.params;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = ({ password }: FormData) => {
    if (userType === 'Comerciante') {
      navigation.navigate('CommercialDataForm', { personalData, password });
    } else {
      navigation.navigate('DocumentUpload', { personalData, password });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Criar Palavra‑Passe</Text>
        <Text style={styles.subtitle}>Defina a sua palavra‑passe para acesso</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Palavra‑passe" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} required />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Confirmar palavra‑passe" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} required />
          )}
        />
      </View>

      <View style={styles.footer}>
        <Button title="Continuar" onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  header: { marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.lg },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body2, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  form: {},
  footer: { marginTop: Theme.spacing.lg },
});
