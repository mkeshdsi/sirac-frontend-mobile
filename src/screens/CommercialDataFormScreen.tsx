import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Input, Card, Select } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, CommercialData } from '@/types';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { listAngariadores, listAprovadores, listValidadores } from '@/services/apiResources';
import DateTimePicker from '@react-native-community/datetimepicker';

type Nav = StackNavigationProp<RootStackParamList, 'CommercialDataForm'>;

// Sem Route; esta tela não recebe params

const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const phoneRegex = /^\d{7,15}$/;

const schema: yup.ObjectSchema<CommercialData> = yup.object({
  // Tipo de Parceiro (AGENTE | MERCHANT)
  tipoParceiro: yup.string().oneOf(['AGENTE', 'MERCHANT'], 'Tipo de parceiro inválido').required('Tipo de parceiro é obrigatório'),
  nomeComercial: yup.string()
    .when('tipoParceiro', {
      is: (v: string) => v === 'MERCHANT',
      then: (s) => s.required('Nome comercial é obrigatório').min(2, 'Mínimo 2 caracteres'),
      otherwise: (s) => s.optional(),
    }),
  nuit: yup.string()
    .when('tipoParceiro', {
      is: 'MERCHANT',
      then: (s) => s.required('NUIT é obrigatório').matches(/^[0-9]{9}$/, 'NUIT deve ter 9 dígitos'),
      otherwise: (s) => s.optional(),
    }),
  alvara: yup.string()
    .when('tipoParceiro', {
      is: 'MERCHANT',
      then: (s) => s.required('Número do alvará é obrigatório'),
      otherwise: (s) => s.optional(),
    }),

  // Datas no formato dd/mm/aaaa (opcionais)
  dataFormulario: yup
    .string()
    .required('Data do formulário é obrigatória')
    .test('date-req', 'Data inválida (dd/mm/aaaa)', (v) => !!v && dateRegex.test(v)),
  dataValidacao: yup
    .string()
    .optional()
    .test('date-opt2', 'Data inválida (dd/mm/aaaa)', (v) => !v || dateRegex.test(v)),
  dataAprovacao: yup
    .string()
    .optional()
    .test('date-opt3', 'Data inválida (dd/mm/aaaa)', (v) => !v || dateRegex.test(v)),

  // Tipo de empresa (enum da API: SOCIEDADE | INDIVIDUAL)
  tipoEmpresa: yup
    .string()
    .oneOf(['SOCIEDADE', 'INDIVIDUAL'], 'Tipo de empresa inválido')
    .when('tipoParceiro', {
      is: 'MERCHANT',
      then: (s) => s.required('Tipo de empresa é obrigatório'),
      otherwise: (s) => s.optional(),
    })
    ,
  designacao: yup.string().optional(),
  naturezaObjecto: yup.string().optional(),
  banco: yup.string().optional(),
  numeroConta: yup.string().optional().test('accnum', 'Nº da conta deve conter apenas dígitos', (v) => !v || /^\d+$/.test(v)),

  // Telefones (opcionais, 7 a 15 dígitos)
  telefone: yup.string().optional().test('tel', 'Telefone inválido', (v) => !v || phoneRegex.test(v)),
  celular: yup.string().optional().test('cel', 'Celular inválido', (v) => !v || phoneRegex.test(v)),
  proprietarioContacto: yup.string().optional().test('propcont', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
  // Lista dinâmica de assistentes
  assistentes: yup
    .array(
      yup.object({
        nomeCompleto: yup.string().optional(),
        contacto: yup.string().optional().test('ass-contact', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
      })
    )
    .optional(),

  // Email do proprietário
  proprietarioEmail: yup.string().optional().email('Email inválido'),
  // Endereço - cidade obrigatória (backend)
  enderecoCidade: yup.string().required('Cidade é obrigatória'),
  enderecoLocalidade: yup.string().optional(),
  enderecoAvenidaRua: yup.string().optional(),
  enderecoNumero: yup.string().optional(),
  enderecoQuart: yup.string().optional(),
  enderecoBairroRef: yup.string().optional(),

  // Assinatura
  assinatura: yup.string().required('Assinatura é obrigatória'),

  // Nomes opcionais
  proprietarioNomeCompleto: yup.string().optional(),
  // os nomes dos assistentes são tratados no array 'assistentes'

  // Substituição (opcional)
  substituicaoNomeAgente: yup.string().optional(),
  substituicaoProvinciaLocalidade: yup.string().optional(),
  substituicaoEnderecoBairro: yup.string().optional(),

  // Profissão (opcional)
  profissao: yup.string().optional(),

  // Relações por ID (opcionais)
  angariadorId: yup.string().optional().test('num', 'ID inválido', (v) => !v || /^\d+$/.test(v)),
  aprovadorId: yup.string().optional().test('num2', 'ID inválido', (v) => !v || /^\d+$/.test(v)),
  validadorId: yup.string().optional().test('num3', 'ID inválido', (v) => !v || /^\d+$/.test(v)),
}) as yup.ObjectSchema<CommercialData>;

interface Props { navigation: Nav }

// Lista dinâmica de Assistentes (declarado fora do componente para evitar erros de escopo)
const AssistentesFieldArray: React.FC<{ control: any }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({ control, name: 'assistentes' });
  return (
    <View>
      {fields.map((field, index) => (
        <View key={field.id} style={{ marginBottom: Theme.spacing.md }}>
          <Controller
            control={control}
            name={`assistentes.${index}.nomeCompleto` as const}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label={`Assistente ${index + 1} - Nome Completo`} placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <Controller
            control={control}
            name={`assistentes.${index}.contacto` as const}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label={`Assistente ${index + 1} - Contacto`} placeholder="" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <View style={{ flexDirection: 'row', gap: Theme.spacing.sm }}>
            <Button title="Remover" variant="outline" onPress={() => remove(index)} style={{ flex: 1 }} />
          </View>
        </View>
      ))}
      <Button title="Adicionar Assistente" onPress={() => append({ nomeCompleto: '', contacto: '' })} />
    </View>
  );
};

export const CommercialDataFormScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState({ ang: false, apr: false, val: false });
  const [angOptions, setAngOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [aprOptions, setAprOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [valOptions, setValOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<CommercialData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      tipoParceiro: 'MERCHANT',
      nomeComercial: '',
      nuit: '',
      alvara: '',
      // Proprietário não é mais pré-preenchido a partir dos dados pessoais
      proprietarioNomeCompleto: '',
      proprietarioContacto: '',
    },
  });
  const tipoParceiro = useWatch({ control, name: 'tipoParceiro' });

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const fetchList = async (resource: 'ang' | 'apr' | 'val') => {
    const params: any = {};
    try {
      if (resource === 'ang') return await listAngariadores(params);
      if (resource === 'apr') return await listAprovadores(params);
      if (resource === 'val') return await listValidadores(params);
      return [];
    } catch {
      return [];
    }
  };

  const loadAng = async () => {
    setLoadingRefs((s) => ({ ...s, ang: true }));
    const data = await fetchList('ang');
    const mapList = (arr: any[]) => (Array.isArray(arr) ? arr : []).map((it: any) => ({ id: it.id, label: it.nome || `#${it.id}` }));
    setAngOptions(mapList(data));
    setLoadingRefs((s) => ({ ...s, ang: false }));
  };
  const loadApr = async () => {
    setLoadingRefs((s) => ({ ...s, apr: true }));
    const data = await fetchList('apr');
    const mapList = (arr: any[]) => (Array.isArray(arr) ? arr : []).map((it: any) => ({ id: it.id, label: it.nome || `#${it.id}` }));
    setAprOptions(mapList(data));
    setLoadingRefs((s) => ({ ...s, apr: false }));
  };
  const loadVal = async () => {
    setLoadingRefs((s) => ({ ...s, val: true }));
    const data = await fetchList('val');
    const mapList = (arr: any[]) => (Array.isArray(arr) ? arr : []).map((it: any) => ({ id: it.id, label: it.nome || `#${it.id}` }));
    setValOptions(mapList(data));
    setLoadingRefs((s) => ({ ...s, val: false }));
  };

  useEffect(() => {
    // Carrega listas uma vez ao montar a tela
    loadAng();
    loadApr();
    loadVal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: CommercialData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      navigation.navigate('DocumentUpload', { commercialData: data });
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
          <Controller control={control} name="nomeComercial" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome Comercial (Designação)" placeholder="Nome do negócio" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nomeComercial?.message} required />
          )} />
          <Controller control={control} name="nuit" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="NUIT" placeholder="123456789" keyboardType="numeric" maxLength={9} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nuit?.message} required />
          )} />
          <Controller control={control} name="alvara" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Número do Alvará" placeholder="Ex: 123/2024" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.alvara?.message} required />
          )} />
          <Controller control={control} name="assinatura" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Assinatura (placeholder)" placeholder="Assinatura do representante" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.assinatura?.message} required />
          )} />
          <Controller
            control={control}
            name="dataFormulario"
            render={({ field: { value, onChange } }) => (
              <View>
                <Input
                  label="Data do Formulário"
                  placeholder="Selecionar data (dd/mm/aaaa)"
                  value={value}
                  editable={false}
                  onPressIn={() => {
                    setTempDate(() => {
                      if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                        const [dd, mm, yyyy] = value.split('/').map((v: string) => parseInt(v, 10));
                        return new Date(yyyy, (mm as number) - 1, dd as number);
                      }
                      return new Date();
                    });
                    setShowDatePicker(true);
                  }}
                  rightIcon={<Text style={{ fontSize: 18 }}>📅</Text>}
                  error={errors.dataFormulario?.message}
                  required
                />

                {showDatePicker && (
                  <DateTimePicker
                    value={tempDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (selectedDate) {
                        setTempDate(selectedDate);
                        onChange(formatDate(selectedDate));
                      }
                    }}
                  />
                )}
              </View>
            )}
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Relações (Opcional)</Text>
          <Text style={{ ...Theme.typography.caption, color: Theme.colors.textSecondary, marginBottom: 8 }}>
            Selecione IDs vindos da API. Não é possível digitar manualmente.
          </Text>
          <Text style={styles.infoTitle}>Angariador</Text>
          <Controller control={control} name="angariadorId" render={({ field: { value, onChange } }) => (
            <Select label="Angariador" value={value as any} onChange={onChange} options={angOptions} loading={loadingRefs.ang} />
          )} />

          <Text style={styles.infoTitle}>Aprovador</Text>
          <Controller control={control} name="aprovadorId" render={({ field: { value, onChange } }) => (
            <Select label="Aprovador" value={value as any} onChange={onChange} options={aprOptions} loading={loadingRefs.apr} />
          )} />

          <Text style={styles.infoTitle}>Validador</Text>
          <Controller control={control} name="validadorId" render={({ field: { value, onChange } }) => (
            <Select label="Validador" value={value as any} onChange={onChange} options={valOptions} loading={loadingRefs.val} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Tipo de Parceiro</Text>
          <Controller
            control={control}
            name="tipoParceiro"
            render={({ field }) => (
              <View style={styles.radioRow}>
                <TouchableOpacity onPress={() => field.onChange('AGENTE')} style={[styles.radioOption, field.value === 'AGENTE' && styles.radioSelected]}>
                  <Text style={field.value === 'AGENTE' ? styles.radioLabelSelected : styles.radioLabel}>AGENTE</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => field.onChange('MERCHANT')} style={[styles.radioOption, field.value === 'MERCHANT' && styles.radioSelected]}>
                  <Text style={field.value === 'MERCHANT' ? styles.radioLabelSelected : styles.radioLabel}>MERCHANT</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {!!errors.tipoParceiro?.message && <Text style={styles.errorTextInline}>{errors.tipoParceiro.message}</Text>}
        </Card>

        {tipoParceiro !== 'AGENTE' && (
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Dados da Empresa</Text>
            <Text style={{ ...Theme.typography.caption, color: Theme.colors.textSecondary, marginBottom: 8 }}>
              Selecione o tipo de empresa exatamente como a API espera
            </Text>
            <Controller
              control={control}
              name="tipoEmpresa"
              render={({ field }) => (
                <View style={styles.radioRow}>
                  <TouchableOpacity onPress={() => field.onChange('SOCIEDADE')} style={[styles.radioOption, field.value === 'SOCIEDADE' && styles.radioSelected]}>
                    <Text style={field.value === 'SOCIEDADE' ? styles.radioLabelSelected : styles.radioLabel}>SOCIEDADE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => field.onChange('INDIVIDUAL')} style={[styles.radioOption, field.value === 'INDIVIDUAL' && styles.radioSelected]}>
                    <Text style={field.value === 'INDIVIDUAL' ? styles.radioLabelSelected : styles.radioLabel}>INDIVIDUAL</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {!!errors.tipoEmpresa?.message && <Text style={styles.errorTextInline}>{errors.tipoEmpresa.message}</Text>}
            <Controller control={control} name="designacao" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Designação" placeholder="Designação da empresa" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
            <Controller control={control} name="naturezaObjecto" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Natureza e Objecto da Actividade" placeholder="Ex: Comércio de ..." value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
            <Controller control={control} name="banco" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Banco" placeholder="Ex: BCI" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
            <Controller control={control} name="numeroConta" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Nº da Conta" placeholder="0000000000" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
          </Card>
        )}

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          <Controller control={control} name="enderecoCidade" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Cidade" placeholder="Ex: Maputo" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.enderecoCidade?.message} required />
          )} />
          <Controller control={control} name="enderecoLocalidade" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Localidade" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="enderecoAvenidaRua" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Avenida/Rua" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="enderecoNumero" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nº" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="enderecoQuart" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Quart." placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="enderecoBairroRef" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Bairro/Ref." placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="telefone" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Telefone" placeholder="" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="celular" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Celular" placeholder="" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Dados dos Proprietários</Text>
          <Controller control={control} name="proprietarioNomeCompleto" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome Completo" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="proprietarioEmail" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Email" placeholder="email@dominio.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="proprietarioContacto" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Contacto" placeholder="" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Assistentes</Text>
          <AssistentesFieldArray control={control} />
        </Card>

        

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Substituição (Agente Merchant)</Text>
          <Controller control={control} name="substituicaoNomeAgente" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="substituicaoProvinciaLocalidade" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Província/Localidade" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="substituicaoEnderecoBairro" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Endereço/Bairro" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Profissão</Text>
          <Controller control={control} name="profissao" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Profissão" placeholder="" value={value} onChangeText={onChange} onBlur={onBlur} />
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
  // Radio styles
  radioRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  radioOption: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border || '#ddd',
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  radioSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '22',
  },
  radioLabel: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  radioLabelSelected: {
    ...Theme.typography.body2,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  errorTextInline: {
    ...Theme.typography.caption,
    color: Theme.colors.error || '#d32f2f',
    marginBottom: Theme.spacing.sm,
  },
  // Chips (para selects de relações)
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border || '#ddd',
    backgroundColor: Theme.colors.surface,
  },
  chipSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '22',
  },
  chipLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  chipLabelSelected: {
    ...Theme.typography.caption,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
});
