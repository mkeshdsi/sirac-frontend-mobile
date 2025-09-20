import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Input, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, CommercialData } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

type Nav = StackNavigationProp<RootStackParamList, 'CommercialDataForm'>;

type Route = RouteProp<RootStackParamList, 'CommercialDataForm'>;

const schema = yup.object({
  nomeComercial: yup.string().required('Nome comercial é obrigatório').min(2, 'Mínimo 2 caracteres'),
  nuit: yup.string().required('NUIT é obrigatório').matches(/^[0-9]{9}$/, 'NUIT deve ter 9 dígitos'),
  alvara: yup.string().required('Número do alvará é obrigatório'),
});

interface Props { navigation: Nav; route: Route }

export const CommercialDataFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { personalData, password } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CommercialData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: CommercialData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      navigation.navigate('DocumentUpload', { personalData, password, commercialData: data });
    } catch (e) {
      Alert.alert('Erro', 'Ocorreu um erro ao processar os dados comerciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Controller control={control} name="nomeComercial" render={({ field }) => (
            <Input label="Nome Comercial" placeholder="Nome do negócio" {...field} error={errors.nomeComercial?.message} required />
          )} />
          <Controller control={control} name="nuit" render={({ field }) => (
            <Input label="NUIT" placeholder="123456789" keyboardType="numeric" maxLength={9} {...field} error={errors.nuit?.message} required />
          )} />
          <Controller control={control} name="alvara" render={({ field }) => (
            <Input label="Número do Alvará" placeholder="Ex: 123/2024" {...field} error={errors.alvara?.message} required />
          )} />
        </Card>

        <Card>
          <Text style={styles.infoTitle}>Documentos necessários na próxima etapa</Text>
          <Text style={styles.infoItem}>• BI (Frente)</Text>
          <Text style={styles.infoItem}>• BI (Verso)</Text>
          <Text style={styles.infoItem}>• Alvará</Text>
          <Text style={styles.infoItem}>• Comprovativo de residência</Text>
          <Text style={styles.infoItem}>• Foto de perfil</Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
        <Button title="Continuar" onPress={handleSubmit(onSubmit)} loading={isLoading} style={{ flex: 2 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: Theme.spacing.lg },
  formCard: { marginBottom: Theme.spacing.lg },
  infoTitle: { ...Theme.typography.h4, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.sm },
  infoItem: { ...Theme.typography.body2, color: Theme.colors.textSecondary, marginBottom: 4 },
  footer: { flexDirection: 'row', gap: Theme.spacing.md, padding: Theme.spacing.lg },
});
