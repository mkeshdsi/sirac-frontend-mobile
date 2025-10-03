import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar, TouchableOpacity, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Input, Card, Select } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, CommercialData } from '@/types';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { listAngariadores, listAprovadores, listValidadores, createAdesao } from '@/services/apiResources';
import DateTimePicker from '@react-native-community/datetimepicker';

type Nav = StackNavigationProp<RootStackParamList, 'CommercialDataForm'>;

const COLORS = {
  primary: '#01836b',
  secondary: '#ffcc03',
  primaryLight: '#01836b15',
  secondaryLight: '#ffcc0315',
  white: '#ffffff',
  background: '#f8f9fa',
  surface: '#ffffff',
  border: '#e0e0e0',
  text: '#1a1a1a',
  textSecondary: '#666666',
  error: '#d32f2f',
  success: '#01836b',
};

const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const phoneRegex = /^\d{7,15}$/;

const schema: yup.ObjectSchema<CommercialData> = yup.object({
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
  tipoEmpresa: yup
    .string()
    .oneOf(['SOCIEDADE', 'INDIVIDUAL'], 'Tipo de empresa inválido')
    .when('tipoParceiro', {
      is: 'MERCHANT',
      then: (s) => s.required('Tipo de empresa é obrigatório'),
      otherwise: (s) => s.optional(),
    }),
  designacao: yup.string().optional(),
  naturezaObjecto: yup.string().optional(),
  banco: yup.string().optional(),
  numeroConta: yup.string().optional().test('accnum', 'Nº da conta deve conter apenas dígitos', (v) => !v || /^\d+$/.test(v)),
  telefone: yup.string().optional().test('tel', 'Telefone inválido', (v) => !v || phoneRegex.test(v)),
  celular: yup.string().optional().test('cel', 'Celular inválido', (v) => !v || phoneRegex.test(v)),
  proprietarioContacto: yup.string().optional().test('propcont', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
  assistentes: yup
    .array(
      yup.object({
        nomeCompleto: yup.string().optional(),
        contacto: yup.string().optional().test('ass-contact', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
      })
    )
    .optional(),
  proprietarios: yup
    .array(
      yup.object({
        nome: yup.string().optional(),
        email: yup.string().optional().email('Email inválido'),
        contacto: yup.string().optional().test('prop-contact', 'Contacto inválido', (v) => !v || phoneRegex.test(v)),
      })
    )
    .optional(),
  estabelecimentos: yup
    .array(
      yup.object({
        nome: yup.string().optional(),
        provinciaLocalidade: yup.string().optional(),
        enderecoBairro: yup.string().optional(),
      })
    )
    .optional(),
  proprietarioEmail: yup.string().optional().email('Email inválido'),
  enderecoCidade: yup.string().required('Cidade é obrigatória'),
  enderecoLocalidade: yup.string().optional(),
  enderecoAvenidaRua: yup.string().optional(),
  enderecoNumero: yup.string().optional(),
  enderecoQuart: yup.string().optional(),
  enderecoBairroRef: yup.string().optional(),
  assinatura: yup.string().required('Assinatura é obrigatória'),
  proprietarioNomeCompleto: yup.string().optional(),
  substituicaoNomeAgente: yup.string().optional(),
  substituicaoProvinciaLocalidade: yup.string().optional(),
  substituicaoEnderecoBairro: yup.string().optional(),
  profissao: yup.string().optional(),
  angariadorId: yup.string().optional().test('num', 'ID inválido', (v) => !v || /^\d+$/.test(v)),
  aprovadorId: yup.string().optional().test('num2', 'ID inválido', (v) => !v || /^\d+$/.test(v)),
  validadorId: yup.string().optional().test('num3', 'ID inválido', (v) => !v || /^\d+$/.test(v)),
}) as yup.ObjectSchema<CommercialData>;

interface Props { navigation: Nav }

const AssistentesFieldArray: React.FC<{ control: any }> = ({ control }) => {
  const { fields, append, remove, move, update } = useFieldArray({ control, name: 'assistentes' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [temp, setTemp] = useState<{ nomeCompleto: string; contacto: string }>({ nomeCompleto: '', contacto: '' });

  const openAdd = () => {
    setEditIndex(null);
    setTemp({ nomeCompleto: '', contacto: '' });
    setModalVisible(true);
  };
  const openEdit = (index: number) => {
    const f: any = fields[index] || {};
    setEditIndex(index);
    setTemp({ nomeCompleto: f.nomeCompleto || '', contacto: f.contacto || '' });
    setModalVisible(true);
  };
  const onSave = () => {
    if (!temp.nomeCompleto && !temp.contacto) { setModalVisible(false); return; }
    if (editIndex === null) append({ ...temp }); else update(editIndex, { ...temp });
    setModalVisible(false);
  };
  const onDelete = () => {
    if (editIndex !== null) { remove(editIndex); }
    setModalVisible(false);
  };

  return (
    <View>
      {fields.length > 0 && (
        <View style={styles.tableHeader}>
          <Text style={styles.th}>Nome Completo</Text>
          <Text style={styles.th}>Contacto</Text>
        </View>
      )}
      {fields.length > 0 && (
        <Text style={[styles.helperText, { marginTop: 4, marginBottom: 6 }]}>Toque numa linha para editar</Text>
      )}
      {fields.map((field, index) => (
        <TouchableOpacity key={field.id} onPress={() => openEdit(index)} activeOpacity={0.8} style={[styles.tableRow, index % 2 ? styles.tableRowAlt : undefined]}>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).nomeCompleto || '-'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).contacto || '-'}</Text></View>
          <View style={[styles.rowActions, { flex: 0.2 }]}>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={openAdd} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Adicionar Assistente</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editIndex === null ? 'Adicionar Assistente' : 'Editar Assistente'}</Text>
            <Input label="Nome Completo" placeholder="Nome Completo" value={temp.nomeCompleto} onChangeText={(t) => setTemp((s) => ({ ...s, nomeCompleto: t }))} />
            <Input label="Contacto" placeholder="Contacto" keyboardType="phone-pad" value={temp.contacto} onChangeText={(t) => setTemp((s) => ({ ...s, contacto: t }))} />
            <View style={styles.modalActions}>
              {editIndex !== null && (
                <TouchableOpacity onPress={onDelete} style={[styles.modalButton, styles.modalDanger]}><Text style={styles.modalButtonText}>Apagar</Text></TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.modalOutline]}><Text style={styles.modalButtonTextOutline}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={[styles.modalButton, styles.modalPrimary]}><Text style={styles.modalButtonText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ProprietariosFieldArray: React.FC<{ control: any }> = ({ control }) => {
  const { fields, append, remove, move, update } = useFieldArray({ control, name: 'proprietarios' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [temp, setTemp] = useState<{ nome: string; email: string; contacto: string }>({ nome: '', email: '', contacto: '' });

  const openAdd = () => {
    setEditIndex(null);
    setTemp({ nome: '', email: '', contacto: '' });
    setModalVisible(true);
  };
  const openEdit = (index: number) => {
    const f: any = fields[index] || {};
    setEditIndex(index);
    setTemp({ nome: f.nome || '', email: f.email || '', contacto: f.contacto || '' });
    setModalVisible(true);
  };
  const onSave = () => {
    if (!temp.nome && !temp.email && !temp.contacto) { setModalVisible(false); return; }
    if (editIndex === null) append({ ...temp }); else update(editIndex, { ...temp });
    setModalVisible(false);
  };
  const onDelete = () => {
    if (editIndex !== null) { remove(editIndex); }
    setModalVisible(false);
  };

  return (
    <View>
      {fields.length > 0 && (
        <View style={styles.tableHeader}>
          <Text style={styles.th}>Nome</Text>
          <Text style={styles.th}>Email</Text>
          <Text style={styles.th}>Contacto</Text>
        </View>
      )}
      {fields.length > 0 && (
        <Text style={[styles.helperText, { marginTop: 4, marginBottom: 6 }]}>Toque numa linha para editar</Text>
      )}
      {fields.map((field, index) => (
        <TouchableOpacity key={field.id} onPress={() => openEdit(index)} activeOpacity={0.8} style={[styles.tableRow, index % 2 ? styles.tableRowAlt : undefined]}>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).nome || '-'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).email || '-'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).contacto || '-'}</Text></View>
          <View style={[styles.rowActions, { flex: 0.2 }]}>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={openAdd} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Adicionar Proprietário</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editIndex === null ? 'Adicionar Proprietário' : 'Editar Proprietário'}</Text>
            <Input label="Nome" placeholder="Nome" value={temp.nome} onChangeText={(t) => setTemp((s) => ({ ...s, nome: t }))} />
            <Input label="Email" placeholder="email@dominio.com" keyboardType="email-address" autoCapitalize="none" value={temp.email} onChangeText={(t) => setTemp((s) => ({ ...s, email: t }))} />
            <Input label="Contacto" placeholder="Contacto" keyboardType="phone-pad" value={temp.contacto} onChangeText={(t) => setTemp((s) => ({ ...s, contacto: t }))} />
            <View style={styles.modalActions}>
              {editIndex !== null && (
                <TouchableOpacity onPress={onDelete} style={[styles.modalButton, styles.modalDanger]}><Text style={styles.modalButtonText}>Apagar</Text></TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.modalOutline]}><Text style={styles.modalButtonTextOutline}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={[styles.modalButton, styles.modalPrimary]}><Text style={styles.modalButtonText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const EstabelecimentosFieldArray: React.FC<{ control: any }> = ({ control }) => {
  const { fields, append, remove, move, update } = useFieldArray({ control, name: 'estabelecimentos' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [temp, setTemp] = useState<{ nome: string; provinciaLocalidade: string; enderecoBairro: string }>({ nome: '', provinciaLocalidade: '', enderecoBairro: '' });

  const openAdd = () => {
    setEditIndex(null);
    setTemp({ nome: '', provinciaLocalidade: '', enderecoBairro: '' });
    setModalVisible(true);
  };
  const openEdit = (index: number) => {
    const f: any = fields[index] || {};
    setEditIndex(index);
    setTemp({ nome: f.nome || '', provinciaLocalidade: f.provinciaLocalidade || '', enderecoBairro: f.enderecoBairro || '' });
    setModalVisible(true);
  };
  const onSave = () => {
    if (!temp.nome && !temp.provinciaLocalidade && !temp.enderecoBairro) { setModalVisible(false); return; }
    if (editIndex === null) append({ ...temp }); else update(editIndex, { ...temp });
    setModalVisible(false);
  };
  const onDelete = () => {
    if (editIndex !== null) { remove(editIndex); }
    setModalVisible(false);
  };

  return (
    <View>
      {fields.length > 0 && (
        <View style={styles.tableHeader}>
          <Text style={styles.th}>Nome</Text>
          <Text style={styles.th}>Província/Localidade</Text>
          <Text style={styles.th}>Endereço/Bairro</Text>
        </View>
      )}
      {fields.length > 0 && (
        <Text style={[styles.helperText, { marginTop: 4, marginBottom: 6 }]}>Toque numa linha para editar</Text>
      )}
      {fields.map((field, index) => (
        <TouchableOpacity key={field.id} onPress={() => openEdit(index)} activeOpacity={0.8} style={[styles.tableRow, index % 2 ? styles.tableRowAlt : undefined]}>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).nome || '-'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).provinciaLocalidade || '-'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).enderecoBairro || '-'}</Text></View>
          <View style={[styles.rowActions, { flex: 0.2 }]}>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={openAdd} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Adicionar Estabelecimento</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editIndex === null ? 'Adicionar Estabelecimento' : 'Editar Estabelecimento'}</Text>
            <Input label="Nome" placeholder="Nome" value={temp.nome} onChangeText={(t) => setTemp((s) => ({ ...s, nome: t }))} />
            <Input label="Província/Localidade" placeholder="Província/Localidade" value={temp.provinciaLocalidade} onChangeText={(t) => setTemp((s) => ({ ...s, provinciaLocalidade: t }))} />
            <Input label="Endereço/Bairro" placeholder="Endereço/Bairro" value={temp.enderecoBairro} onChangeText={(t) => setTemp((s) => ({ ...s, enderecoBairro: t }))} />
            <View style={styles.modalActions}>
              {editIndex !== null && (
                <TouchableOpacity onPress={onDelete} style={[styles.modalButton, styles.modalDanger]}><Text style={styles.modalButtonText}>Apagar</Text></TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.modalOutline]}><Text style={styles.modalButtonTextOutline}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={[styles.modalButton, styles.modalPrimary]}><Text style={styles.modalButtonText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      proprietarioNomeCompleto: '',
      proprietarioContacto: '',
      proprietarios: [],
      estabelecimentos: [],
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
    loadAng();
    loadApr();
    loadVal();
  }, []);

  const onSubmit = async (data: CommercialData) => {
    setIsLoading(true);
    try {
      const created = await createAdesao(data as any);
      navigation.navigate('DocumentUpload', { commercialData: created || data });
    } catch (e) {
      Alert.alert('Erro', 'Ocorreu um erro ao enviar os dados comerciais. Verifique a conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dados Comerciais</Text>
        <Text style={styles.headerSubtitle}>Preencha as informações do parceiro</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de Parceiro */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👤</Text>
            </View>
            <Text style={styles.cardTitle}>Tipo de Parceiro</Text>
          </View>
          <Controller
            control={control}
            name="tipoParceiro"
            render={({ field }) => (
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  onPress={() => field.onChange('AGENTE')} 
                  style={[styles.radioCard, field.value === 'AGENTE' && styles.radioCardSelected]}
                >
                  <View style={[styles.radioIndicator, field.value === 'AGENTE' && styles.radioIndicatorSelected]}>
                    {field.value === 'AGENTE' && <View style={styles.radioIndicatorInner} />}
                  </View>
                  <Text style={[styles.radioLabel, field.value === 'AGENTE' && styles.radioLabelSelected]}>AGENTE</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => field.onChange('MERCHANT')} 
                  style={[styles.radioCard, field.value === 'MERCHANT' && styles.radioCardSelected]}
                >
                  <View style={[styles.radioIndicator, field.value === 'MERCHANT' && styles.radioIndicatorSelected]}>
                    {field.value === 'MERCHANT' && <View style={styles.radioIndicatorInner} />}
                  </View>
                  <Text style={[styles.radioLabel, field.value === 'MERCHANT' && styles.radioLabelSelected]}>MERCHANT</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {!!errors.tipoParceiro?.message && <Text style={styles.errorText}>{errors.tipoParceiro.message}</Text>}
        </Card>

        {/* Informações Básicas */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>Informações Básicas</Text>
          </View>
          <Controller control={control} name="nomeComercial" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome Comercial" placeholder="Nome do negócio" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nomeComercial?.message} required />
          )} />
          <Controller control={control} name="nuit" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="NUIT" placeholder="123456789" keyboardType="numeric" maxLength={9} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nuit?.message} required />
          )} />
          <Controller control={control} name="alvara" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Número do Alvará" placeholder="Ex: 123/2024" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.alvara?.message} required />
          )} />
          <Controller control={control} name="assinatura" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Assinatura" placeholder="Assinatura do representante" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.assinatura?.message} required />
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

        {/* Relações */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🔗</Text>
            </View>
            <Text style={styles.cardTitle}>Relações</Text>
          </View>
          <Text style={styles.helperText}>Selecione os responsáveis (opcional)</Text>
          <Controller control={control} name="angariadorId" render={({ field: { value, onChange } }) => (
            <Select label="Angariador" value={value as any} onChange={onChange} options={angOptions} loading={loadingRefs.ang} />
          )} />
          <Controller control={control} name="aprovadorId" render={({ field: { value, onChange } }) => (
            <Select label="Aprovador" value={value as any} onChange={onChange} options={aprOptions} loading={loadingRefs.apr} />
          )} />
          <Controller control={control} name="validadorId" render={({ field: { value, onChange } }) => (
            <Select label="Validador" value={value as any} onChange={onChange} options={valOptions} loading={loadingRefs.val} />
          )} />
        </Card>

        {/* Dados da Empresa */}
        {tipoParceiro === 'MERCHANT' && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>🏢</Text>
              </View>
              <Text style={styles.cardTitle}>Dados da Empresa</Text>
            </View>
            <Controller
              control={control}
              name="tipoEmpresa"
              render={({ field }) => (
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    onPress={() => field.onChange('SOCIEDADE')} 
                    style={[styles.radioCard, field.value === 'SOCIEDADE' && styles.radioCardSelected]}
                  >
                    <View style={[styles.radioIndicator, field.value === 'SOCIEDADE' && styles.radioIndicatorSelected]}>
                      {field.value === 'SOCIEDADE' && <View style={styles.radioIndicatorInner} />}
                    </View>
                    <Text style={[styles.radioLabel, field.value === 'SOCIEDADE' && styles.radioLabelSelected]}>SOCIEDADE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => field.onChange('INDIVIDUAL')} 
                    style={[styles.radioCard, field.value === 'INDIVIDUAL' && styles.radioCardSelected]}
                  >
                    <View style={[styles.radioIndicator, field.value === 'INDIVIDUAL' && styles.radioIndicatorSelected]}>
                      {field.value === 'INDIVIDUAL' && <View style={styles.radioIndicatorInner} />}
                    </View>
                    <Text style={[styles.radioLabel, field.value === 'INDIVIDUAL' && styles.radioLabelSelected]}>INDIVIDUAL</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {!!errors.tipoEmpresa?.message && <Text style={styles.errorText}>{errors.tipoEmpresa.message}</Text>}
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

        {/* Endereço */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📍</Text>
            </View>
            <Text style={styles.cardTitle}>Endereço</Text>
          </View>
          <Controller control={control} name="enderecoCidade" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Cidade" placeholder="Ex: Maputo" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.enderecoCidade?.message} required />
          )} />
          <Controller control={control} name="enderecoLocalidade" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Localidade" placeholder="Localidade" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="enderecoAvenidaRua" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Avenida/Rua" placeholder="Avenida/Rua" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="enderecoNumero" render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Nº" placeholder="Nº" value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="enderecoQuart" render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Quart." placeholder="Quart." value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </View>
          </View>
          <Controller control={control} name="enderecoBairroRef" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Bairro/Ref." placeholder="Bairro/Referência" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="telefone" render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Telefone" placeholder="Telefone" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="celular" render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Celular" placeholder="Celular" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
            </View>
          </View>
        </Card>

        {/* Proprietários */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👥</Text>
            </View>
            <Text style={styles.cardTitle}>Proprietários</Text>
          </View>
          <ProprietariosFieldArray control={control} />
        </Card>

        {/* Assistentes */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🤝</Text>
            </View>
            <Text style={styles.cardTitle}>Assistentes</Text>
          </View>
          <AssistentesFieldArray control={control} />
        </Card>

        {/* Estabelecimentos */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🏪</Text>
            </View>
            <Text style={styles.cardTitle}>Estabelecimentos</Text>
          </View>
          <EstabelecimentosFieldArray control={control} />
        </Card>

        {/* Substituição */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🔄</Text>
            </View>
            <Text style={styles.cardTitle}>Substituição (Agente Merchant)</Text>
          </View>
          <Controller control={control} name="substituicaoNomeAgente" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Nome" placeholder="Nome do substituto" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="substituicaoProvinciaLocalidade" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Província/Localidade" placeholder="Província/Localidade" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="substituicaoEnderecoBairro" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Endereço/Bairro" placeholder="Endereço/Bairro" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        </Card>

        {/* Profissão */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>💼</Text>
            </View>
            <Text style={styles.cardTitle}>Profissão</Text>
          </View>
          <Controller control={control} name="profissao" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Profissão" placeholder="Profissão" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        </Card>

        {/* Documentos Necessários */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: COLORS.secondaryLight }]}>
              <Text style={styles.cardIcon}>📄</Text>
            </View>
            <Text style={styles.cardTitle}>Documentos Necessários</Text>
          </View>
          <Text style={styles.helperText}>Na próxima etapa, será necessário fazer upload dos seguintes documentos:</Text>
          <View style={styles.docList}>
            <View style={styles.docItem}>
              <Text style={styles.docBullet}>•</Text>
              <Text style={styles.docText}>BI (Frente)</Text>
            </View>
            <View style={styles.docItem}>
              <Text style={styles.docBullet}>•</Text>
              <Text style={styles.docText}>BI (Verso)</Text>
            </View>
            <View style={styles.docItem}>
              <Text style={styles.docBullet}>•</Text>
              <Text style={styles.docText}>Alvará</Text>
            </View>
            <View style={styles.docItem}>
              <Text style={styles.docBullet}>•</Text>
              <Text style={styles.docText}>Comprovativo de residência</Text>
            </View>
            <View style={styles.docItem}>
              <Text style={styles.docBullet}>•</Text>
              <Text style={styles.docText}>Foto de perfil</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Footer com botões */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.footerButtonSecondary}
        >
          <Text style={styles.footerButtonSecondaryText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleSubmit(onSubmit)} 
          style={styles.footerButtonPrimary}
          disabled={isLoading}
        >
          <Text style={styles.footerButtonPrimaryText}>
            {isLoading ? 'Processando...' : 'Continuar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: { 
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  radioCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  radioCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioIndicatorSelected: {
    borderColor: COLORS.primary,
  },
  radioIndicatorInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radioLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: -8,
    marginBottom: 12,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  th: { 
    flex: 1, 
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: COLORS.white,
  },
  tableRowAlt: {
    backgroundColor: COLORS.background,
  },
  td: { 
    flex: 1,
  },
  rowActions: { 
    flexDirection: 'row', 
    gap: 6,
    justifyContent: 'flex-end',
  },
  cellText: { 
    fontSize: 14,
    color: COLORS.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalDanger: {
    backgroundColor: COLORS.error,
  },
  modalOutline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  modalButtonTextOutline: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonSuccess: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  iconButtonDanger: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  iconButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  iconButtonTextWhite: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginRight: 2,
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  infoCard: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  docList: {
    marginTop: 8,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  docBullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    fontWeight: '700',
  },
  docText: {
    fontSize: 14,
    color: COLORS.text,
  },
  footer: { 
    flexDirection: 'row', 
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  footerButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footerButtonPrimary: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  footerButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});