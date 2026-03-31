import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, PersonalData } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

type Nav = StackNavigationProp<RootStackParamList, 'PersonalDataForm'>;

// Mozambique mobile prefixes: Vodacom (82/83), Movitel (84/85), TMcel (86/87)
const phoneRegex = /^(258)?(82|83|84|85|86|87)\d{7}$/;

// BI: exactamente 12 dígitos seguidos de 1 letra
const biRegex = /^[0-9]{12}[A-Za-z]$/;

const schema = yup.object({
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  telefone: yup
    .string()
    .required('Telefone é obrigatório')
    .test(
      'moz-phone',
      'Use prefix 82, 83, 84, 85, 86 ou 87 + 7 dígitos (ex: 821234567)',
      (v) => !v || phoneRegex.test(v.replace(/\s/g, ''))
    ),
  biNumero: yup
    .string()
    .required('Nº do BI é obrigatório')
    .test(
      'bi-format',
      'BI deve ter 12 dígitos + 1 letra no final (ex: 123456789012A)',
      (v) => !v || biRegex.test(v)
    ),
});

interface Props {
  navigation: Nav;
}

export const PersonalDataFormScreen: React.FC<Props> = ({ navigation }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<PersonalData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: PersonalData) => {
    navigation.navigate('PasswordCreation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dados Pessoais</Text>
        <Text style={styles.subtitle}>Preencha as suas informações</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="nome"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nome Completo"
              placeholder="Ex: João da Silva"
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.nome?.message}
              required
            />
          )}
        />

        <Controller
          control={control}
          name="telefone"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <Input
                label="Telefone"
                placeholder="Ex: 821234567 ou 841234567"
                keyboardType="phone-pad"
                maxLength={12}
                value={value}
                onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 12))}
                onBlur={onBlur}
                error={errors.telefone?.message}
                required
              />
              <Text style={styles.hint}>Aceita: 82, 83, 84, 85, 86 ou 87 + 7 dígitos</Text>
            </>
          )}
        />

        <Controller
          control={control}
          name="biNumero"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <Input
                label="Nº do BI"
                placeholder="Ex: 123456789012A"
                autoCapitalize="characters"
                maxLength={13}
                value={value}
                onChangeText={(t) =>
                  onChange(t.replace(/[^0-9a-zA-Z]/g, '').toUpperCase().slice(0, 13))
                }
                onBlur={onBlur}
                error={errors.biNumero?.message}
                required
              />
              <Text style={styles.hint}>12 dígitos numéricos + 1 letra no final</Text>
            </>
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
  hint: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 2,
  },
});
