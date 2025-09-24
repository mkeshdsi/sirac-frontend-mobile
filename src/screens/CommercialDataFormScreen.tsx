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

const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const phoneRegex = /^\d{7,15}$/;

const schema: yup.ObjectSchema<CommercialData> = yup.object({
  nomeComercial: yup.string().required('Nome comercial é obrigatório').min(2, 'Mínimo 2 caracteres'),
  nuit: yup
    .string()
    .required('NUIT é obrigatório')
    .matches(/^[0-9]{9}$/, 'NUIT deve ter 9 dígitos'),
  alvara: yup.string().required('Número do alvará é obrigatório'),

  // Datas no formato dd/mm/aaaa (opcionais)
  dataFormulario: yup
    .string()
    .optional()
    .test('date-opt', 'Data inválida (dd/mm/aaaa)', (v) => !v || dateRegex.test(v)),
  dataValidacao: yup
    .string()
    .optional()
    .test('date-opt2', 'Data inválida (dd/mm/aaaa)', (v) => !v || dateRegex.test(v)),
  dataAprovacao: yup
    .string()
    .optional()
    .test('date-opt3', 'Data inválida (dd/mm/aaaa)', (v) => !v || dateRegex.test(v)),

  // Tipo de empresa (opcional, mas com valores sugeridos)
  tipoEmpresa: yup
    .string()
    .oneOf(['Sociedade', 'Individual'], 'Tipo de empresa inválido')
    .optional()
    ,
  designacao: yup.string().optional(),
  naturezaObjecto: yup.string().optional(),
  banco: yup.string().optional(),
  numeroConta: yup.string().optional().test('accnum', 'Nº da conta deve conter apenas dígitos', (v) => !v || /^\d+$/.test(v)),

  // Telefones (opcionais, 7 a 15 dígitos)
  telefone: yup.string().optional().test('tel', 'Telefone inválido', (v) => !v || phoneRegex.test(v)),
  celular: yup.string().optional().test('cel', 'Celular inválido', (v) => !v || phoneRegex.test(v)),
  proprietarioContacto: yup.string().optional().test('propcont', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
  assistente1Contacto: yup.string().optional().test('a1', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
  assistente2Contacto: yup.string().optional().test('a2', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
  angariadorCelular: yup.string().optional().test('ang', 'Celular inválido', (v) => !v || phoneRegex.test(v)),

  // Email do proprietário
  proprietarioEmail: yup.string().optional().email('Email inválido'),
}) as yup.ObjectSchema<CommercialData>;

interface Props { navigation: Nav; route: Route }

export const CommercialDataFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { personalData, password } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CommercialData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      nomeComercial: '',
      nuit: '',
      alvara: '',
    },
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
            <Input label="Nome Comercial (Designação)" placeholder="Nome do negócio" {...field} error={errors.nomeComercial?.message} required />
          )} />
          <Controller control={control} name="nuit" render={({ field }) => (
            <Input label="NUIT" placeholder="123456789" keyboardType="numeric" maxLength={9} {...field} error={errors.nuit?.message} required />
          )} />
          <Controller control={control} name="alvara" render={({ field }) => (
            <Input label="Número do Alvará" placeholder="Ex: 123/2024" {...field} error={errors.alvara?.message} required />
          )} />
          <Controller control={control} name="assinatura" render={({ field }) => (
            <Input label="Assinatura (placeholder)" placeholder="Assinatura do representante" {...field} />
          )} />
          <Controller control={control} name="dataFormulario" render={({ field }) => (
            <Input label="Data do Formulário" placeholder="dd/mm/aaaa" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Dados da Empresa</Text>
          <Controller control={control} name="tipoEmpresa" render={({ field }) => (
            <Input label="Tipo de Empresa" placeholder="Sociedade ou Individual" {...field} />
          )} />
          <Controller control={control} name="designacao" render={({ field }) => (
            <Input label="Designação" placeholder="Designação da empresa" {...field} />
          )} />
          <Controller control={control} name="naturezaObjecto" render={({ field }) => (
            <Input label="Natureza e Objecto da Actividade" placeholder="Ex: Comércio de ..." {...field} />
          )} />
          <Controller control={control} name="banco" render={({ field }) => (
            <Input label="Banco" placeholder="Ex: BCI" {...field} />
          )} />
          <Controller control={control} name="numeroConta" render={({ field }) => (
            <Input label="Nº da Conta" placeholder="0000000000" keyboardType="number-pad" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          <Controller control={control} name="enderecoCidade" render={({ field }) => (
            <Input label="Cidade" placeholder="Ex: Maputo" {...field} />
          )} />
          <Controller control={control} name="enderecoLocalidade" render={({ field }) => (
            <Input label="Localidade" placeholder="" {...field} />
          )} />
          <Controller control={control} name="enderecoAvenidaRua" render={({ field }) => (
            <Input label="Avenida/Rua" placeholder="" {...field} />
          )} />
          <Controller control={control} name="enderecoNumero" render={({ field }) => (
            <Input label="Nº" placeholder="" {...field} />
          )} />
          <Controller control={control} name="enderecoQuart" render={({ field }) => (
            <Input label="Quart." placeholder="" {...field} />
          )} />
          <Controller control={control} name="enderecoBairroRef" render={({ field }) => (
            <Input label="Bairro/Ref." placeholder="" {...field} />
          )} />
          <Controller control={control} name="telefone" render={({ field }) => (
            <Input label="Telefone" placeholder="" keyboardType="phone-pad" {...field} />
          )} />
          <Controller control={control} name="celular" render={({ field }) => (
            <Input label="Celular" placeholder="" keyboardType="phone-pad" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Dados dos Proprietários</Text>
          <Controller control={control} name="proprietarioNomeCompleto" render={({ field }) => (
            <Input label="Nome Completo" placeholder="" {...field} />
          )} />
          <Controller control={control} name="proprietarioEmail" render={({ field }) => (
            <Input label="Email" placeholder="email@dominio.com" keyboardType="email-address" autoCapitalize="none" {...field} />
          )} />
          <Controller control={control} name="proprietarioContacto" render={({ field }) => (
            <Input label="Contacto" placeholder="" keyboardType="phone-pad" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Estabelecimentos Assistentes</Text>
          <Controller control={control} name="assistente1NomeCompleto" render={({ field }) => (
            <Input label="Assistente 1 - Nome Completo" placeholder="" {...field} />
          )} />
          <Controller control={control} name="assistente1Contacto" render={({ field }) => (
            <Input label="Assistente 1 - Contacto" placeholder="" keyboardType="phone-pad" {...field} />
          )} />
          <Controller control={control} name="assistente2NomeCompleto" render={({ field }) => (
            <Input label="Assistente 2 - Nome Completo" placeholder="" {...field} />
          )} />
          <Controller control={control} name="assistente2Contacto" render={({ field }) => (
            <Input label="Assistente 2 - Contacto" placeholder="" keyboardType="phone-pad" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Angariador</Text>
          <Controller control={control} name="angariadorNome" render={({ field }) => (
            <Input label="Nome" placeholder="" {...field} />
          )} />
          <Controller control={control} name="angariadorCelular" render={({ field }) => (
            <Input label="Celular" placeholder="" keyboardType="phone-pad" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>A preencher pela carteira móvel</Text>
          <Controller control={control} name="validadoPorNome" render={({ field }) => (
            <Input label="Validado por (Nome)" placeholder="" {...field} />
          )} />
          <Controller control={control} name="validadoPorFuncao" render={({ field }) => (
            <Input label="Validado por (Função)" placeholder="" {...field} />
          )} />
          <Controller control={control} name="dataValidacao" render={({ field }) => (
            <Input label="Data de Validação" placeholder="dd/mm/aaaa" {...field} />
          )} />
          <Controller control={control} name="aprovadoPorNome" render={({ field }) => (
            <Input label="Aprovado por (Nome)" placeholder="" {...field} />
          )} />
          <Controller control={control} name="aprovadoPorFuncao" render={({ field }) => (
            <Input label="Aprovado por (Função)" placeholder="" {...field} />
          )} />
          <Controller control={control} name="dataAprovacao" render={({ field }) => (
            <Input label="Data de Aprovação" placeholder="dd/mm/aaaa" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Substituição (Agente Merchant)</Text>
          <Controller control={control} name="substituicaoNomeAgente" render={({ field }) => (
            <Input label="Nome" placeholder="" {...field} />
          )} />
          <Controller control={control} name="substituicaoProvinciaLocalidade" render={({ field }) => (
            <Input label="Província/Localidade" placeholder="" {...field} />
          )} />
          <Controller control={control} name="substituicaoEnderecoBairro" render={({ field }) => (
            <Input label="Endereço/Bairro" placeholder="" {...field} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Parceiro Oficial e Profissão</Text>
          <Controller control={control} name="parceiroOficial" render={({ field }) => (
            <Input label="Parceiro Oficial" placeholder="" {...field} />
          )} />
          <Controller control={control} name="profissao" render={({ field }) => (
            <Input label="Profissão" placeholder="" {...field} />
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
  sectionTitle: { ...Theme.typography.h4, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.md },
  footer: { flexDirection: 'row', gap: Theme.spacing.md, padding: Theme.spacing.lg },
});
