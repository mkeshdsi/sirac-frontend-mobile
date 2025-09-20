import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, PersonalData } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

type Nav = StackNavigationProp<RootStackParamList, 'PersonalDataForm'>;

type Route = RouteProp<RootStackParamList, 'PersonalDataForm'>;

const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Mínimo 2 caracteres'),
  telefone: yup.string().required('Telefone é obrigatório'),
  biNumero: yup.string().required('Nº do BI é obrigatório'),
});

interface Props {
  navigation: Nav;
  route: Route;
}

export const PersonalDataFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userType } = route.params;

  const { control, handleSubmit, formState: { errors } } = useForm<PersonalData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: PersonalData) => {
    navigation.navigate('PasswordCreation', { userType, personalData: data });
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
            <Input label="Nome" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nome?.message} required />
          )}
        />
        <Controller
          control={control}
          name="telefone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Telefone" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.telefone?.message} required />
          )}
        />
        <Controller
          control={control}
          name="biNumero"
          render={({ field: { onChange, onBlur, value} }) => (
            <Input label="Nº do BI" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.biNumero?.message} required />
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
