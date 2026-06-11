import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar, TouchableOpacity, Platform, Modal, Image, TextInput, ActivityIndicator } from 'react-native';
import ReactNative from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Input, Card, Select } from '@/components';
import SignaturePadModal from '@/components/SignaturePadModal';
import { MOZ_BANKS } from '@/components/constants/moz_banks';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, CommercialData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LocalizacaoOption, listAngariadores, listAprovadores, listValidadores, createAdesao, searchLocalizacoes } from '@/services/apiResources';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

type Nav = StackNavigationProp<RootStackParamList, 'CommercialDataForm'>;
type Route = RouteProp<RootStackParamList, 'CommercialDataForm'>;

const COLORS = {
  primary: '#01836b',
  secondary: '#ffcc03',
  primaryLight: '#01836b15',
  secondaryLight: '#ffcc0315',
  white: '#ffffff',
  background: '#f4f6f8',
  surface: '#ffffff',
  border: '#e8ecf0',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  error: '#d32f2f',
  success: '#01836b',
};

const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const phoneRegex = /^(258)?(82|83|84|85|86|87)\d{7}$/;
const agentPhoneRegex = /^(258)?(82|83)\d{7}$/;
const normalizePhone = (s?: string) => (s ? s.replace(/[^0-9]/g, '') : '');

const schema: yup.ObjectSchema<CommercialData> = yup.object({
  tipoParceiro: yup.string().oneOf(['AGENTE', 'MERCHANT'], 'Tipo de parceiro inválido').required('Tipo de parceiro é obrigatório'),
  nomeComercial: yup.string().required('Nome comercial é obrigatório').min(2, 'Mínimo 2 caracteres'),
  nuit: yup.string().when('tipoParceiro', { is: 'MERCHANT', then: (s) => s.required('NUIT é obrigatório').matches(/^[0-9]{9}$/, 'NUIT deve ter 9 dígitos'), otherwise: (s) => s.optional() }),
  contactoAgente: yup.string().optional().test('tel', 'O contacto do agente deve ser 82 ou 83 (ex: 821234567)', (v) => !v || agentPhoneRegex.test(v)),
  tipoDocumento: yup.string().oneOf(['BI', 'PASSAPORTE', 'CARTAO_ELEITOR', 'CARTA_CONDUCAO'], 'Tipo de documento inválido').optional(),
  numeroDocumento: yup.string().when('tipoDocumento', { is: 'BI', then: (s) => s.required('Nº do BI é obrigatório').matches(/^[0-9]{12}[A-Za-z]$/, 'BI deve ter 12 dígitos e 1 letra no final'), otherwise: (s) => s.optional() }),
  alvara: yup.string().when(['tipoParceiro', 'tipoDocumento'], { is: (tipoParceiro: string, tipoDocumento: string) => tipoParceiro === 'MERCHANT' || tipoDocumento === 'CARTA_CONDUCAO', then: (s) => s.required('Número do alvará/licença é obrigatório'), otherwise: (s) => s.optional() }),
  dataFormulario: yup.string().required('Data do formulário é obrigatória').test('date-req', 'Data inválida (dd/mm/aaaa)', (v) => !!v && dateRegex.test(v)),
  dataValidacao: yup.string().optional().test('date-opt2', 'Data inválida (dd/mm/aaaa)', (v) => !v || dateRegex.test(v)),
  dataAprovacao: yup.string().optional().test('date-opt3', 'Data inválida (dd/mm/aaaa)', (v) => !v || dateRegex.test(v)),
  tipoEmpresa: yup.string().oneOf(['SOCIEDADE', 'INDIVIDUAL'], 'Tipo de empresa inválido').when('tipoParceiro', { is: 'MERCHANT', then: (s) => s.required('Tipo de empresa é obrigatório'), otherwise: (s) => s.optional() }),
  designacao: yup.string().required('Designação é obrigatória').min(2, 'Mínimo 2 caracteres'),
  naturezaObjecto: yup.string().optional(),
  banco: yup.string().optional(),
  numeroConta: yup.string().optional().test('accnum', 'Nº da conta deve conter apenas dígitos', (v) => !v || /^\d+$/.test(v)),
  telefone: yup.string().optional().test('tel', 'Use 82, 83, 84, 85, 86 ou 87 + 7 dígitos', (v) => !v || phoneRegex.test(v)),
  celular: yup.string().optional().test('cel', 'Use 82, 83, 84, 85, 86 ou 87 + 7 dígitos', (v) => !v || phoneRegex.test(v)),
  proprietarioContacto: yup.string().optional().test('propcont', 'Use 82, 83, 84, 85, 86 ou 87 + 7 dígitos', (v) => !v || phoneRegex.test(v)),
  assistentes: yup.array(yup.object({ nomeCompleto: yup.string().required('Nome do assistente é obrigatório').min(2, 'Nome do assistente muito curto'), contacto: yup.string().optional().test('ass-contact', 'Use 82, 83, 84, 85, 86 ou 87 + 7 dígitos', (v) => !v || phoneRegex.test(v)) })).optional(),
  proprietarios: yup.array(yup.object({ nome: yup.string().optional(), email: yup.string().optional().email('Email inválido'), contacto: yup.string().optional().test('prop-contact', 'Use 82, 83, 84, 85, 86 ou 87 + 7 dígitos', (v) => !v || phoneRegex.test(v)) })).optional(),
  estabelecimentos: yup.array(yup.object({ nome: yup.string().optional(), provinciaLocalidade: yup.string().optional(), enderecoBairro: yup.string().optional() })).optional(),
  proprietarioEmail: yup.string().optional().email('Email inválido'),
  enderecoCidade: yup.string().required('Cidade é obrigatória'),
  enderecoLocalidade: yup.string().optional(),
  enderecoAvenidaRua: yup.string().optional(),
  enderecoNumero: yup.string().optional(),
  enderecoQuart: yup.string().optional(),
  enderecoBairroRef: yup.string().optional(),
  localizacaoId: yup.number().optional(),
  localizacaoDisplay: yup.string().optional(),
  localizacaoNivel: yup.string().optional(),
  assinatura: yup.string().required('Assinatura é obrigatória'),
  proprietarioNomeCompleto: yup.string().optional(),
  substituicaoNomeAgente: yup.string().optional(),
  substituicaoProvinciaLocalidade: yup.string().optional(),
  substituicaoEnderecoBairro: yup.string().optional(),
  profissao: yup.string().optional(),
  latitude: yup.number().typeError('Latitude é obrigatória').required('Latitude é obrigatória'),
  longitude: yup.number().typeError('Longitude é obrigatória').required('Longitude é obrigatória'),
  fotografia: yup.string().optional(),
}) as any;

interface Props { navigation: Nav; route: Route }

type SelectedMapPoint = {
  latitude: number;
  longitude: number;
  address?: Location.LocationGeocodedAddress;
};

type LocationSearchResult = {
  latitude: number;
  longitude: number;
  address?: Location.LocationGeocodedAddress;
  title: string;
  subtitle: string;
};

type LocalizacaoSearchProps = {
  selectedLabel?: string;
  onSelect: (item: LocalizacaoOption) => void;
  onClear: () => void;
};

const getLocalizacaoTitle = (item: LocalizacaoOption) => (
  item.bairro || item.localidade || item.posto_administrativo || item.distrito || item.provincia || item.nome_display
);

const getLocalizacaoSubtitle = (item: LocalizacaoOption) => (
  [item.nivel, item.localidade, item.posto_administrativo, item.distrito, item.provincia]
    .filter(Boolean)
    .join(' · ')
);

const LocalizacaoSearch: React.FC<LocalizacaoSearchProps> = ({ selectedLabel, onSelect, onClear }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalizacaoOption[]>([]);
  const [loading, setLoading] = useState(false);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (selectedLabel && text !== selectedLabel) {
      onClear();
    }
  };

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchLocalizacoes(clean);
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (item: LocalizacaoOption) => {
    onSelect(item);
    setQuery(item.nome_display);
    setResults([]);
  };

  return (
    <View style={styles.locationSearchWrap}>
      <Input
        label="Pesquisar localização"
        placeholder="Bairro, distrito ou província"
        value={query}
        onChangeText={handleQueryChange}
        autoCorrect={false}
        rightIcon={loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : selectedLabel ? <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} /> : <Ionicons name="search" size={18} color={COLORS.textSecondary} />}
      />
      {!!selectedLabel && (
        <View style={styles.selectedLocationCard}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.selectedLocationText}>{selectedLabel}</Text>
        </View>
      )}
      {results.length > 0 && (
        <View style={styles.locationResults}>
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={styles.locationResultItem} onPress={() => handleSelect(item)} activeOpacity={0.75}>
              <View style={styles.locationResultIcon}>
                <Ionicons name={item.nivel === 'bairro' ? 'home-outline' : 'location-outline'} size={17} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationResultTitle}>{getLocalizacaoTitle(item)}</Text>
                <Text style={styles.locationResultSubtitle}>{getLocalizacaoSubtitle(item)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const DEFAULT_MAP_REGION: Region = {
  latitude: -25.9667,
  longitude: 32.5833,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const formatAddress = (address?: Location.LocationGeocodedAddress) => {
  if (!address) return '';
  return [
    address.name,
    address.street,
    address.district,
    address.city,
    address.region,
    address.country,
  ].filter(Boolean).join(', ');
};

// ── Shared section card ──────────────────────────────────
const SectionCard = ({ emoji, title, children, accent = false }: any) => (
  <View style={[styles.card, accent && styles.cardAccent]}>
    <View style={styles.cardHeader}>
      <View style={[styles.cardIconContainer, accent && styles.cardIconContainerAccent]}>
        <Text style={styles.cardIcon}>{emoji}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ── Field Arrays ─────────────────────────────────────────
const AssistentesFieldArray: React.FC<{ control: any }> = ({ control }) => {
  const { fields, append, remove, update } = useFieldArray({ control, name: 'assistentes' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [temp, setTemp] = useState<{ nomeCompleto: string; contacto: string }>({ nomeCompleto: '', contacto: '' });

  const openAdd = () => { setEditIndex(null); setTemp({ nomeCompleto: '', contacto: '' }); setModalVisible(true); };
  const openEdit = (index: number) => { const f: any = fields[index] || {}; setEditIndex(index); setTemp({ nomeCompleto: f.nomeCompleto || '', contacto: f.contacto || '' }); setModalVisible(true); };
  const onSave = () => {
    const cleanedName = (temp.nomeCompleto || '').replace(/\s+/g, ' ').trim();
    if (!cleanedName || cleanedName.length < 2) { Alert.alert('Assistente', 'Informe o Nome Completo do assistente.'); return; }
    if (editIndex === null) append({ ...temp, nomeCompleto: cleanedName }); else update(editIndex, { ...temp, nomeCompleto: cleanedName });
    setModalVisible(false);
  };
  const onDelete = () => { if (editIndex !== null) { remove(editIndex); } setModalVisible(false); };

  return (
    <View>
      {fields.length > 0 && (
        <>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Nome Completo</Text>
            <Text style={styles.th}>Contacto</Text>
          </View>
          <Text style={styles.tapHint}>Toque numa linha para editar</Text>
        </>
      )}
      {fields.map((field, index) => (
        <TouchableOpacity key={field.id} onPress={() => openEdit(index)} activeOpacity={0.8}
          style={[styles.tableRow, index % 2 ? styles.tableRowAlt : undefined]}>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).nomeCompleto || '—'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).contacto || '—'}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={openAdd} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
        <Text style={styles.addButtonText}>Adicionar Assistente</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalTitle}>{editIndex === null ? 'Adicionar Assistente' : 'Editar Assistente'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input label="Nome Completo" placeholder="Nome Completo" value={temp.nomeCompleto} autoCapitalize="words" autoCorrect={false}
              onChangeText={(t) => setTemp((s) => ({ ...s, nomeCompleto: t.replace(/\s+/g, ' ').replace(/^\s+/, '') }))} />
            <Input label="Contacto" placeholder="Contacto" keyboardType="phone-pad" maxLength={9} value={temp.contacto}
              onChangeText={(t) => setTemp((s) => ({ ...s, contacto: normalizePhone(t).slice(0, 9) }))} />
            <View style={styles.modalActions}>
              {editIndex !== null && (
                <TouchableOpacity onPress={onDelete} style={styles.btnDanger}><Text style={styles.btnWhiteText}>Apagar</Text></TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnOutline}><Text style={styles.btnPrimaryText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={styles.btnPrimary}><Text style={styles.btnWhiteText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ProprietariosFieldArray: React.FC<{ control: any }> = ({ control }) => {
  const { fields, append, remove, update } = useFieldArray({ control, name: 'proprietarios' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [temp, setTemp] = useState<{ nome: string; email: string; contacto: string }>({ nome: '', email: '', contacto: '' });

  const openAdd = () => { setEditIndex(null); setTemp({ nome: '', email: '', contacto: '' }); setModalVisible(true); };
  const openEdit = (index: number) => { const f: any = fields[index] || {}; setEditIndex(index); setTemp({ nome: f.nome || '', email: f.email || '', contacto: f.contacto || '' }); setModalVisible(true); };
  const onSave = () => { if (!temp.nome && !temp.email && !temp.contacto) { setModalVisible(false); return; } if (editIndex === null) append({ ...temp }); else update(editIndex, { ...temp }); setModalVisible(false); };
  const onDelete = () => { if (editIndex !== null) { remove(editIndex); } setModalVisible(false); };

  return (
    <View>
      {fields.length > 0 && (
        <>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Nome</Text>
            <Text style={styles.th}>Email</Text>
            <Text style={styles.th}>Contacto</Text>
          </View>
          <Text style={styles.tapHint}>Toque numa linha para editar</Text>
        </>
      )}
      {fields.map((field, index) => (
        <TouchableOpacity key={field.id} onPress={() => openEdit(index)} activeOpacity={0.8}
          style={[styles.tableRow, index % 2 ? styles.tableRowAlt : undefined]}>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).nome || '—'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).email || '—'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).contacto || '—'}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={openAdd} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
        <Text style={styles.addButtonText}>Adicionar Proprietário</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalTitle}>{editIndex === null ? 'Adicionar Proprietário' : 'Editar Proprietário'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input label="Nome" placeholder="Nome" value={temp.nome} onChangeText={(t) => setTemp((s) => ({ ...s, nome: t }))} />
            <Input label="Email" placeholder="email@dominio.com" keyboardType="email-address" autoCapitalize="none" value={temp.email} onChangeText={(t) => setTemp((s) => ({ ...s, email: t }))} />
            <Input label="Contacto" placeholder="Contacto" keyboardType="phone-pad" maxLength={9} value={temp.contacto} onChangeText={(t) => setTemp((s) => ({ ...s, contacto: normalizePhone(t).slice(0, 9) }))} />
            <View style={styles.modalActions}>
              {editIndex !== null && <TouchableOpacity onPress={onDelete} style={styles.btnDanger}><Text style={styles.btnWhiteText}>Apagar</Text></TouchableOpacity>}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnOutline}><Text style={styles.btnPrimaryText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={styles.btnPrimary}><Text style={styles.btnWhiteText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const EstabelecimentosFieldArray: React.FC<{ control: any }> = ({ control }) => {
  const { fields, append, remove, update } = useFieldArray({ control, name: 'estabelecimentos' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [temp, setTemp] = useState<{ nome: string; provinciaLocalidade: string; enderecoBairro: string }>({ nome: '', provinciaLocalidade: '', enderecoBairro: '' });

  const openAdd = () => { setEditIndex(null); setTemp({ nome: '', provinciaLocalidade: '', enderecoBairro: '' }); setModalVisible(true); };
  const openEdit = (index: number) => { const f: any = fields[index] || {}; setEditIndex(index); setTemp({ nome: f.nome || '', provinciaLocalidade: f.provinciaLocalidade || '', enderecoBairro: f.enderecoBairro || '' }); setModalVisible(true); };
  const onSave = () => { if (!temp.nome && !temp.provinciaLocalidade && !temp.enderecoBairro) { setModalVisible(false); return; } if (editIndex === null) append({ ...temp }); else update(editIndex, { ...temp }); setModalVisible(false); };
  const onDelete = () => { if (editIndex !== null) { remove(editIndex); } setModalVisible(false); };

  return (
    <View>
      {fields.length > 0 && (
        <>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Nome</Text>
            <Text style={styles.th}>Província</Text>
            <Text style={styles.th}>Bairro</Text>
          </View>
          <Text style={styles.tapHint}>Toque numa linha para editar</Text>
        </>
      )}
      {fields.map((field, index) => (
        <TouchableOpacity key={field.id} onPress={() => openEdit(index)} activeOpacity={0.8}
          style={[styles.tableRow, index % 2 ? styles.tableRowAlt : undefined]}>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).nome || '—'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).provinciaLocalidade || '—'}</Text></View>
          <View style={styles.td}><Text style={styles.cellText}>{(field as any).enderecoBairro || '—'}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={openAdd} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
        <Text style={styles.addButtonText}>Adicionar Estabelecimento</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalTitle}>{editIndex === null ? 'Adicionar Estabelecimento' : 'Editar Estabelecimento'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input label="Nome" placeholder="Nome" value={temp.nome} onChangeText={(t) => setTemp((s) => ({ ...s, nome: t }))} />
            <Input label="Província/Localidade" placeholder="Província/Localidade" value={temp.provinciaLocalidade} onChangeText={(t) => setTemp((s) => ({ ...s, provinciaLocalidade: t }))} />
            <Input label="Endereço/Bairro" placeholder="Endereço/Bairro" value={temp.enderecoBairro} onChangeText={(t) => setTemp((s) => ({ ...s, enderecoBairro: t }))} />
            <View style={styles.modalActions}>
              {editIndex !== null && <TouchableOpacity onPress={onDelete} style={styles.btnDanger}><Text style={styles.btnWhiteText}>Apagar</Text></TouchableOpacity>}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnOutline}><Text style={styles.btnPrimaryText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={styles.btnPrimary}><Text style={styles.btnWhiteText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Main screen ──────────────────────────────────────────
export const CommercialDataFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { personalData, password } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [fieldPositions, setFieldPositions] = useState<Record<string, number>>({});
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, trigger, getValues } = useForm<CommercialData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      tipoParceiro: 'MERCHANT', nomeComercial: '', nuit: '', alvara: '',
      tipoEmpresa: undefined as any, proprietarioNomeCompleto: '', proprietarioContacto: '',
      assistentes: [], proprietarios: [], estabelecimentos: [],
    },
  });

  const tipoParceiro = useWatch({ control, name: 'tipoParceiro' });
  const tipoDocumento = useWatch({ control, name: 'tipoDocumento' });
  const fotografiaValue = useWatch({ control, name: 'fotografia' });
  const latitudeValue = useWatch({ control, name: 'latitude' });
  const longitudeValue = useWatch({ control, name: 'longitude' });
  const selectedLocalizacaoLabel = useWatch({ control, name: 'localizacaoDisplay' });
  const selectedLocalizacaoId = useWatch({ control, name: 'localizacaoId' });
  const hasSelectedLocalizacao = !!selectedLocalizacaoId;
  const [bankMode, setBankMode] = useState<'lista' | 'outro'>('lista');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showCurrentLocationModal, setShowCurrentLocationModal] = useState(false);
  const [showLoadingLocationModal, setShowLoadingLocationModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [selectedMapPoint, setSelectedMapPoint] = useState<SelectedMapPoint | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [canShowUserLocation, setCanShowUserLocation] = useState(false);
  const [mapStatusMessage, setMapStatusMessage] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState('');
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false);
  const [showSuccessLocationModal, setShowSuccessLocationModal] = useState(false);
  const [successLocationMessage, setSuccessLocationMessage] = useState('');

  const getCurrentLocation = async () => { setShowCurrentLocationModal(true); };

  const applyAddressToForm = (address?: Location.LocationGeocodedAddress) => {
    if (!address) return;

    const city = address.city || address.subregion || address.region;
    const locality = address.district || address.subregion;
    const street = address.street || address.name;
    const number = address.streetNumber;
    const reference = [address.district, address.name].filter(Boolean).join(', ');

    if (city) setValue('enderecoCidade', city, { shouldValidate: true, shouldDirty: true });
    if (locality) setValue('enderecoLocalidade', locality, { shouldDirty: true });
    if (street) setValue('enderecoAvenidaRua', street, { shouldDirty: true });
    if (number) setValue('enderecoNumero', number, { shouldDirty: true });
    if (reference) setValue('enderecoBairroRef', reference, { shouldDirty: true });
  };

  const applyLocalizacaoToForm = (item: LocalizacaoOption) => {
    setValue('localizacaoId', item.id, { shouldDirty: true });
    setValue('localizacaoDisplay', item.nome_display, { shouldDirty: true });
    setValue('localizacaoNivel', item.nivel, { shouldDirty: true });

    if (item.provincia) {
      setValue('enderecoCidade', item.provincia, { shouldValidate: true, shouldDirty: true });
    }
    if (item.distrito) {
      setValue('enderecoLocalidade', item.distrito, { shouldDirty: true });
    }
    if (item.bairro || item.localidade || item.posto_administrativo) {
      setValue('enderecoBairroRef', item.bairro || item.localidade || item.posto_administrativo || '', { shouldDirty: true });
    }
  };

  const clearLocalizacaoFromForm = () => {
    setValue('localizacaoId', undefined, { shouldDirty: true });
    setValue('localizacaoDisplay', '', { shouldDirty: true });
    setValue('localizacaoNivel', '', { shouldDirty: true });
    setValue('enderecoCidade', '', { shouldValidate: true, shouldDirty: true });
    setValue('enderecoLocalidade', '', { shouldDirty: true });
    setValue('enderecoBairroRef', '', { shouldDirty: true });
  };

  const resolveAddress = async (latitude: number, longitude: number) => {
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      return address;
    } catch {
      return undefined;
    }
  };

  const updateSelectedMapPoint = async (latitude: number, longitude: number, shouldMoveMap = false) => {
    setIsResolvingAddress(true);
    const address = await resolveAddress(latitude, longitude);
    setSelectedMapPoint({ latitude, longitude, address });
    if (shouldMoveMap) {
      setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    }
    setIsResolvingAddress(false);
  };

  const ensureLocationServices = async () => {
    let enabled = await Location.hasServicesEnabledAsync();

    if (!enabled && Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
        enabled = await Location.hasServicesEnabledAsync();
      } catch {
        enabled = false;
      }
    }

    setCanShowUserLocation(enabled);
    return enabled;
  };

  const confirmSelectedMapPoint = () => {
    if (!selectedMapPoint) {
      setShowErrorModal('Selecione uma localização no mapa antes de confirmar.');
      return;
    }

    const { latitude, longitude, address } = selectedMapPoint;
    setValue('latitude', latitude, { shouldValidate: true, shouldDirty: true });
    setValue('longitude', longitude, { shouldValidate: true, shouldDirty: true });
    applyAddressToForm(address);
    setShowMapPicker(false);
    setSuccessLocationMessage([
      'Localização selecionada:',
      `Lat: ${latitude.toFixed(6)}`,
      `Lng: ${longitude.toFixed(6)}`,
      formatAddress(address),
    ].filter(Boolean).join('\n'));
    setShowSuccessLocationModal(true);
  };

  const handleGetCurrentLocation = async () => {
    setShowCurrentLocationModal(false);
    setShowLoadingLocationModal(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setShowLoadingLocationModal(false); setShowPermissionDeniedModal(true); return; }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const address = await resolveAddress(location.coords.latitude, location.coords.longitude);
      setValue('latitude', location.coords.latitude, { shouldValidate: true, shouldDirty: true });
      setValue('longitude', location.coords.longitude, { shouldValidate: true, shouldDirty: true });
      applyAddressToForm(address);
      setShowLoadingLocationModal(false);
      setSuccessLocationMessage([
        'Localização obtida:',
        `Lat: ${location.coords.latitude.toFixed(6)}`,
        `Lng: ${location.coords.longitude.toFixed(6)}`,
        formatAddress(address),
      ].filter(Boolean).join('\n'));
      setShowSuccessLocationModal(true);
    } catch (error) {
      setShowLoadingLocationModal(false);
      setShowErrorModal('Falha ao obter localização. Tente novamente.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) { Alert.alert('Permissão negada', 'É necessário conceder permissão para usar a câmera.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.5 });
      if (!result.canceled && result.assets && result.assets[0]?.uri) { setValue('fotografia', result.assets[0].uri, { shouldDirty: true }); }
    } catch (error) { Alert.alert('Erro', 'Falha ao tirar foto. Tente novamente.'); }
  };

  const searchLocations = async (query: string) => {
    const cleanedQuery = query.trim();
    if (!cleanedQuery) { setSearchResults([]); setSearchMessage(''); return; }
    setIsSearchingLocation(true);
    setSearchMessage('');
    try {
      const results = await Location.geocodeAsync(cleanedQuery);
      if (results.length > 0) {
        const mapped = await Promise.all(results.slice(0, 6).map(async (coords) => {
          const address = await resolveAddress(coords.latitude, coords.longitude);
          const formatted = formatAddress(address);
          return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            address,
            title: address?.name || address?.street || cleanedQuery,
            subtitle: formatted || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
          };
        }));
        setSearchResults(mapped);
        setSearchMessage('');
      }
      else {
        setSearchResults([]);
        setSearchMessage('Nenhum resultado encontrado.');
      }
    } catch (error) {
      setSearchResults([]);
      setSearchMessage('Não foi possível pesquisar agora. Continue digitando ou tente outro endereço.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const selectLocation = (location: LocationSearchResult) => {
    setSearchResults([]);
    setShowSearch(false);
    setSearchQuery('');
    setSelectedMapPoint({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    });
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setShowMapPicker(true);
  };

  const openMapsForLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setShowPermissionDeniedModal(true); return; }

      setMapStatusMessage('');
      setShowMapPicker(true);

      const savedLat = getValues('latitude');
      const savedLng = getValues('longitude');
      if (savedLat && savedLng) {
        setSelectedMapPoint({ latitude: savedLat, longitude: savedLng });
        setMapRegion({ latitude: savedLat, longitude: savedLng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        updateSelectedMapPoint(savedLat, savedLng);
        return;
      }

      setMapRegion(DEFAULT_MAP_REGION);
      setSelectedMapPoint(null);
      const servicesEnabled = await ensureLocationServices();
      if (!servicesEnabled) {
        setMapStatusMessage('Localização do telefone desligada. O mapa abriu em Maputo; ative o GPS ou pesquise o endereço.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updateSelectedMapPoint(location.coords.latitude, location.coords.longitude, true);
    } catch (error) {
      setCanShowUserLocation(false);
      setMapStatusMessage('Não foi possível obter a localização atual. Pode selecionar no mapa ou pesquisar o endereço.');
      setShowMapPicker(true);
    }
  };

  const formatDate = (d: Date) => { const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; };
  const onLayoutField = (name: keyof CommercialData | string) => (e: any) => { const y = e?.nativeEvent?.layout?.y ?? 0; setFieldPositions((s) => ({ ...s, [String(name)]: y })); };

  useEffect(() => {
    (async () => { await trigger('dataFormulario'); setValue('dataFormulario', formatDate(new Date()), { shouldValidate: true }); })();
  }, []);

  useEffect(() => {
    if (tipoParceiro === 'MERCHANT') { const current = getValues('tipoEmpresa'); if (!current) setValue('tipoEmpresa', 'SOCIEDADE', { shouldValidate: true }); }
    else setValue('tipoEmpresa', undefined as any, { shouldValidate: false });
  }, [tipoParceiro]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchResults([]);
      setSearchMessage(query.length > 0 ? 'Digite pelo menos 3 caracteres.' : '');
      setIsSearchingLocation(false);
      return;
    }

    setIsSearchingLocation(true);
    const timeout = setTimeout(() => {
      searchLocations(query);
    }, 700);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const onSubmit = async (data: CommercialData) => {
    try { setIsLoading(true); navigation.navigate('DocumentUpload', { ...route.params, commercialData: data }); }
    finally { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Formulário de Adesão</Text>
            <Text style={styles.headerSubtitle}>Preencha as informações do parceiro</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Dados do Agente ── */}
        <SectionCard emoji="👤" title="Dados do Agente">
          <View onLayout={onLayoutField('contactoAgente')}>
            <Controller control={control} name="contactoAgente" render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Input label="Contacto do Agente" placeholder="Ex: 821234567" keyboardType="phone-pad" maxLength={9}
                  value={value} onChangeText={(t) => onChange(normalizePhone(t).slice(0, 9))} onBlur={onBlur} error={errors.contactoAgente?.message} />
                <View style={styles.infoBadge}>
                  <Ionicons name="information-circle-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.infoBadgeText}>Apenas prefixos 82 ou 83 são aceitos</Text>
                </View>
              </>
            )} />
          </View>
          <View onLayout={onLayoutField('tipoDocumento')}>
            <Text style={styles.fieldLabel}>Tipo de Documento</Text>
            <Controller control={control} name="tipoDocumento" render={({ field: { onChange, value } }) => (
              <Select label="Selecionar tipo de documento" placeholder="Selecionar tipo de documento"
                value={value || (null as any)} onChange={onChange} errorText={errors.tipoDocumento?.message}
                options={[{ id: 'BI', label: 'BI' }, { id: 'PASSAPORTE', label: 'Passaporte' }, { id: 'CARTAO_ELEITOR', label: 'Cartão de Eleitor' }, { id: 'CARTA_CONDUCAO', label: 'Carta de Condução' }]} />
            )} />
          </View>
          <View onLayout={onLayoutField('numeroDocumento')}>
            <Controller control={control} name="numeroDocumento" render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Input label="Número do Documento" placeholder={tipoDocumento === 'BI' ? 'Ex: 123456789012A' : 'Número do Documento'}
                  value={value} maxLength={13} autoCapitalize="characters"
                  onChangeText={(t) => {
                    if (tipoDocumento === 'BI') {
                      const clean = t.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
                      let result = '';
                      for (let i = 0; i < Math.min(clean.length, 13); i++) {
                        if (i < 12) { if (/[0-9]/.test(clean[i])) result += clean[i]; }
                        else { if (/[A-Z]/.test(clean[i])) result += clean[i]; }
                      }
                      onChange(result);
                    } else { onChange(t.toUpperCase().slice(0, 13)); }
                  }}
                  onBlur={onBlur} error={errors.numeroDocumento?.message} />
                {tipoDocumento === 'BI' && <Text style={styles.helperText}>12 dígitos numéricos + 1 letra no final</Text>}
              </>
            )} />
          </View>
        </SectionCard>

        {/* ── Tipo de Parceiro ── */}
        <SectionCard emoji="💼" title="Tipo de Parceiro">
          <Controller control={control} name="tipoParceiro" render={({ field: { onChange, value } }) => (
            <View style={styles.radioGroup}>
              {(['MERCHANT', 'AGENTE'] as const).map((opt) => (
                <TouchableOpacity key={opt} onPress={() => onChange(opt)}
                  style={[styles.radioCard, value === opt && styles.radioCardSelected]}>
                  <View style={[styles.radioIndicator, value === opt && styles.radioIndicatorSelected]}>
                    {value === opt && <View style={styles.radioIndicatorInner} />}
                  </View>
                  <Text style={[styles.radioLabel, value === opt && styles.radioLabelSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )} />
        </SectionCard>

        {/* ── Dados Empresa ── */}
        <SectionCard emoji="🏢" title="Dados da Empresa">
          <View onLayout={onLayoutField('nuit')}>
            <Controller control={control} name="nuit" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="NUIT" placeholder="123456789" keyboardType="numeric" maxLength={9} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nuit?.message} required />
            )} />
          </View>
          <Controller control={control} name="alvara" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Número do Alvará/Licença" placeholder="Ex: 123/2024" value={value} onChangeText={onChange} onBlur={onBlur}
              error={errors.alvara?.message} required={tipoParceiro === 'MERCHANT' || tipoDocumento === 'CARTA_CONDUCAO'} />
          )} />
          <View onLayout={onLayoutField('nomeComercial')}>
            <Controller control={control} name="nomeComercial" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Nome Comercial" placeholder="Nome do negócio" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nomeComercial?.message} required />
            )} />
          </View>
          <View onLayout={onLayoutField('tipoEmpresa')}>
            <Text style={styles.fieldLabel}>Tipo de Empresa</Text>
            <Controller control={control} name="tipoEmpresa" render={({ field }) => (
              <View style={styles.radioGroup}>
                {(['SOCIEDADE', 'INDIVIDUAL'] as const).map((opt) => (
                  <TouchableOpacity key={opt} onPress={() => field.onChange(opt)}
                    style={[styles.radioCard, field.value === opt && styles.radioCardSelected]}>
                    <View style={[styles.radioIndicator, field.value === opt && styles.radioIndicatorSelected]}>
                      {field.value === opt && <View style={styles.radioIndicatorInner} />}
                    </View>
                    <Text style={[styles.radioLabel, field.value === opt && styles.radioLabelSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )} />
          </View>
          {!!errors.tipoEmpresa?.message && <Text style={styles.errorText}>{errors.tipoEmpresa.message}</Text>}
          <View onLayout={onLayoutField('designacao')}>
            <Controller control={control} name="designacao" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Designação" placeholder="Designação da empresa" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.designacao?.message} required />
            )} />
          </View>
          <Controller control={control} name="naturezaObjecto" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Natureza e objecto da actividade" placeholder="Ex: Comércio de ..." value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="banco" render={({ field: { onChange, onBlur, value } }) => (
            <View>
              {tipoParceiro === 'MERCHANT' && (
                <>
                  <Text style={styles.fieldLabel}>Banco</Text>
                  <Select label="Selecionar banco"
                    value={(bankMode === 'outro' ? 'Outro' : (value as any)) || (null as any)}
                    onChange={(val: any) => {
                      const found = MOZ_BANKS.find((b) => String(b.id) === String(val) || b.label === val);
                      if (String(val) === 'Outro' || found?.label === 'Outro') { setBankMode('outro'); onChange(''); }
                      else { setBankMode('lista'); onChange(found?.label ?? String(val)); }
                    }}
                    options={MOZ_BANKS} />
                  {bankMode === 'outro' && (
                    <Input label="Digite o nome do banco" placeholder="Digite o nome do banco"
                      value={typeof value === 'string' ? value : ''} onChangeText={onChange} onBlur={onBlur}
                      required error={errors.banco?.message} />
                  )}
                </>
              )}
            </View>
          )} />
          {tipoParceiro === 'MERCHANT' && (
            <Controller control={control} name="numeroConta" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Nº da Conta" placeholder="0000000000" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
          )}
          <Controller control={control} name="profissao" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Profissão" placeholder="Profissão" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        </SectionCard>

        {/* ── Endereço ── */}
        <SectionCard emoji="📍" title="Endereço">
          <LocalizacaoSearch selectedLabel={selectedLocalizacaoLabel} onSelect={applyLocalizacaoToForm} onClear={clearLocalizacaoFromForm} />
          <View onLayout={onLayoutField('enderecoCidade')}>
            <Controller control={control} name="enderecoCidade" render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Província"
                placeholder="Ex: Cidade de Maputo"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.enderecoCidade?.message}
                required
                editable={!hasSelectedLocalizacao}
                rightIcon={hasSelectedLocalizacao ? <Ionicons name="lock-closed-outline" size={17} color={COLORS.textSecondary} /> : undefined}
              />
            )} />
          </View>
          <Controller control={control} name="enderecoLocalidade" render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Distrito"
              placeholder="Distrito"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              editable={!hasSelectedLocalizacao}
              rightIcon={hasSelectedLocalizacao ? <Ionicons name="lock-closed-outline" size={17} color={COLORS.textSecondary} /> : undefined}
            />
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
            <Input
              label="Bairro/Ref."
              placeholder="Bairro/Referência"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              editable={!hasSelectedLocalizacao}
              rightIcon={hasSelectedLocalizacao ? <Ionicons name="lock-closed-outline" size={17} color={COLORS.textSecondary} /> : undefined}
            />
          )} />
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="telefone" render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Telefone" placeholder="Ex: 821234567" keyboardType="phone-pad" maxLength={9}
                  value={value} onChangeText={(t) => onChange(normalizePhone(t).slice(0, 9))} onBlur={onBlur} error={errors.telefone?.message} />
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="celular" render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Celular" placeholder="Ex: 841234567" keyboardType="phone-pad" maxLength={9}
                  value={value} onChangeText={(t) => onChange(normalizePhone(t).slice(0, 9))} onBlur={onBlur} error={errors.celular?.message} />
              )} />
            </View>
          </View>
        </SectionCard>

        {/* ── Localização da Banca ── */}
        <View onLayout={onLayoutField('latitude')}>
        <SectionCard emoji="🗺️" title="Localização da Banca">
          {(latitudeValue && longitudeValue) ? (
            <View style={styles.coordsCard}>
              <View style={styles.coordsHeader}>
                <View style={styles.coordsIconWrap}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.coordsTitle}>Localização Capturada</Text>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
              <View style={styles.coordsBody}>
                <View style={styles.coordItem}>
                  <Text style={styles.coordLabel}>LATITUDE</Text>
                  <Text style={styles.coordValue}>{latitudeValue?.toFixed(6)}</Text>
                </View>
                <View style={styles.coordDivider} />
                <View style={styles.coordItem}>
                  <Text style={styles.coordLabel}>LONGITUDE</Text>
                  <Text style={styles.coordValue}>{longitudeValue?.toFixed(6)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="latitude" render={({ field: { value } }) => (
                  <Input label="Latitude" placeholder="Pendente..." editable={false} value={value !== undefined && value !== null ? String(value) : ''} error={errors.latitude?.message} required />
                )} />
              </View>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="longitude" render={({ field: { value } }) => (
                  <Input label="Longitude" placeholder="Pendente..." editable={false} value={value !== undefined && value !== null ? String(value) : ''} error={errors.longitude?.message} required />
                )} />
              </View>
            </View>
          )}
          {(errors.latitude?.message || errors.longitude?.message) && (
            <View style={styles.geoErrorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.geoErrorText}>Capture ou selecione a localização da banca antes de avançar.</Text>
            </View>
          )}
          <View style={styles.locationBtns}>
            <TouchableOpacity onPress={openMapsForLocation} style={styles.locBtn} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.primary, '#02a882']} style={styles.locBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="map-outline" size={16} color="white" />
                <Text style={styles.locBtnText}>Abrir Mapa</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSearch(true)} style={[styles.locBtn, styles.locBtnOutline]} activeOpacity={0.85}>
              <Ionicons name="search-outline" size={16} color={COLORS.primary} />
              <Text style={styles.locBtnTextOutline}>Pesquisar Endereço</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={getCurrentLocation} style={[styles.locBtn, styles.locBtnOutline]} activeOpacity={0.85}>
              <Ionicons name="locate-outline" size={16} color={COLORS.primary} />
              <Text style={styles.locBtnTextOutline}>Localização Atual</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.fieldLabel}>Fotografia da Banca (opcional)</Text>
            {fotografiaValue ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: fotografiaValue }} style={styles.photoPreview} />
                <TouchableOpacity onPress={() => setValue('fotografia', '')} style={styles.removePhotoBtn}>
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text style={styles.removePhotoBtnText}>Remover</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={takePhoto} style={styles.photoBtn} activeOpacity={0.85}>
                <View style={styles.photoBtnInner}>
                  <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.photoBtnText}>Tirar Foto da Banca</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </SectionCard>
        </View>

        {/* ── Estabelecimentos ── */}
        <SectionCard emoji="🏪" title="Estabelecimentos">
          <EstabelecimentosFieldArray control={control} />
        </SectionCard>

        {/* ── Assistentes ── */}
        <SectionCard emoji="🤝" title="Assistentes">
          <AssistentesFieldArray control={control} />
        </SectionCard>

        {/* ── Assinatura e Data ── */}
        <SectionCard emoji="✍️" title="Assinatura e Data">
          <View onLayout={onLayoutField('assinatura')}>
            <Controller control={control} name="assinatura" render={({ field: { value, onChange } }) => (
              <View>
                {value ? (
                  <View style={styles.signaturePreviewBlock}>
                    <ReactNative.Image source={{ uri: value }} style={styles.signaturePreview} resizeMode="contain" />
                    <TouchableOpacity onPress={() => setShowSignature(true)} style={[styles.btnOutline, { marginTop: 8, alignSelf: 'center' }]}>
                      <Text style={styles.btnPrimaryText}>Refazer assinatura</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setShowSignature(true)} style={styles.signBtn} activeOpacity={0.85}>
                    <Ionicons name="create-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.signBtnText}>Assinar no ecrã</Text>
                  </TouchableOpacity>
                )}
                {!!errors.assinatura?.message && <Text style={styles.errorText}>{errors.assinatura.message}</Text>}
                <SignaturePadModal visible={showSignature} onOK={(sig) => { onChange(sig); }} onClose={() => setShowSignature(false)} />
              </View>
            )} />
          </View>
          <View onLayout={onLayoutField('dataFormulario')}>
            <Controller control={control} name="dataFormulario" render={({ field: { value, onChange } }) => (
              <View>
                <Input label="Data do Formulário" placeholder="Selecionar data (dd/mm/aaaa)" value={value} editable={false}
                  onPressIn={() => {
                    setTempDate(() => { if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) { const [dd, mm, yyyy] = value.split('/').map((v: string) => parseInt(v, 10)); return new Date(yyyy, (mm as number) - 1, dd as number); } return new Date(); });
                    setShowDatePicker(true);
                  }}
                  rightIcon={<Text style={{ fontSize: 16 }}>📅</Text>} error={errors.dataFormulario?.message} required />
                {showDatePicker && (
                  <DateTimePicker value={tempDate || new Date()} mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (selectedDate) { setTempDate(selectedDate); onChange(formatDate(selectedDate)); }
                    }} />
                )}
              </View>
            )} />
          </View>
        </SectionCard>

        {/* ── Proprietários ── */}
        <SectionCard emoji="👥" title="Dados dos Proprietários">
          <ProprietariosFieldArray control={control} />
        </SectionCard>

        {/* ── Documentos info card ── */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: COLORS.secondaryLight }]}>
              <Text style={styles.cardIcon}>📄</Text>
            </View>
            <Text style={styles.cardTitle}>Documentos Necessários</Text>
          </View>
          <Text style={styles.helperText}>Na próxima etapa, será necessário fazer upload dos seguintes documentos:</Text>
          <View style={styles.docList}>
            {['BI (Frente)', 'BI (Verso)', 'Alvará', 'Comprovativo de residência', 'Foto de perfil'].map((doc) => (
              <View key={doc} style={styles.docItem}>
                <View style={styles.docDot} />
                <Text style={styles.docText}>{doc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Location Search Modal ── */}
      <Modal visible={showSearch} transparent animationType="slide" onRequestClose={() => setShowSearch(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalTitle}>Pesquisar Localização</Text>
              <TouchableOpacity onPress={() => setShowSearch(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <TextInput style={styles.searchInput} placeholder="Digite o endereço ou nome do local"
                value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            {isSearchingLocation && (
              <View style={styles.searchStateRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.searchStateText}>A pesquisar...</Text>
              </View>
            )}
            {searchResults.length > 0 && (
              <ScrollView style={{ maxHeight: 280 }}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity key={index} style={styles.searchResultItem} onPress={() => selectLocation(result)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultTitle}>{result.title}</Text>
                      <Text style={styles.searchResultSub}>{result.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {!!searchMessage && !isSearchingLocation && searchResults.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={styles.helperText}>{searchMessage}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Map Picker Modal ── */}
      <Modal visible={showMapPicker} animationType="slide" onRequestClose={() => setShowMapPicker(false)}>
        <SafeAreaView style={styles.mapModalRoot}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity onPress={() => setShowMapPicker(false)} style={styles.mapHeaderBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapModalTitle}>Selecionar Localização</Text>
              <Text style={styles.mapModalSubtitle}>Toque no mapa ou arraste o marcador</Text>
            </View>
            <TouchableOpacity onPress={() => { setShowMapPicker(false); setTimeout(() => setShowSearch(true), 250); }} style={styles.mapHeaderBtn}>
              <Ionicons name="search-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <MapView
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={styles.mapView}
            initialRegion={DEFAULT_MAP_REGION}
            region={mapRegion}
            loadingEnabled
            loadingIndicatorColor={COLORS.primary}
            loadingBackgroundColor={COLORS.background}
            showsUserLocation={canShowUserLocation}
            showsMyLocationButton={canShowUserLocation}
            onRegionChangeComplete={setMapRegion}
            onPress={(event) => {
              const { latitude, longitude } = event.nativeEvent.coordinate;
              updateSelectedMapPoint(latitude, longitude);
            }}
          >
            {selectedMapPoint && (
              <Marker
                coordinate={{ latitude: selectedMapPoint.latitude, longitude: selectedMapPoint.longitude }}
                draggable
                title="Localização da banca"
                description={formatAddress(selectedMapPoint.address) || 'Ponto selecionado'}
                onDragEnd={(event) => {
                  const { latitude, longitude } = event.nativeEvent.coordinate;
                  updateSelectedMapPoint(latitude, longitude);
                }}
              />
            )}
          </MapView>

          <View style={styles.mapBottomSheet}>
            {!!mapStatusMessage && (
              <View style={styles.mapNotice}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.mapNoticeText}>{mapStatusMessage}</Text>
              </View>
            )}
            <View style={styles.mapAddressRow}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mapAddressTitle}>
                  {isResolvingAddress ? 'A obter endereço...' : formatAddress(selectedMapPoint?.address) || 'Ponto selecionado'}
                </Text>
                <Text style={styles.mapAddressSub}>
                  {selectedMapPoint ? `${selectedMapPoint.latitude.toFixed(6)}, ${selectedMapPoint.longitude.toFixed(6)}` : 'Selecione um ponto no mapa'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={confirmSelectedMapPoint}
              disabled={!selectedMapPoint}
              style={[styles.mapConfirmBtn, !selectedMapPoint && styles.mapConfirmBtnDisabled]}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color="white" />
              <Text style={styles.mapConfirmText}>Confirmar localização</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Error Modal ── */}
      <Modal visible={!!showErrorModal} transparent animationType="fade" onRequestClose={() => setShowErrorModal('')}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.centeredModalCard]}>
            <View style={[styles.modalIconRing, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="alert-circle" size={36} color={COLORS.error} />
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.error, textAlign: 'center' }]}>Erro</Text>
            <Text style={styles.modalMsg}>{showErrorModal}</Text>
            <TouchableOpacity style={[styles.btnPrimary, { alignSelf: 'stretch', alignItems: 'center', backgroundColor: COLORS.error }]}
              onPress={() => setShowErrorModal('')}>
              <Text style={styles.btnWhiteText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Permission Denied Modal ── */}
      <Modal visible={showPermissionDeniedModal} transparent animationType="fade" onRequestClose={() => setShowPermissionDeniedModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.centeredModalCard]}>
            <View style={[styles.modalIconRing, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="lock-closed" size={36} color={COLORS.error} />
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.error, textAlign: 'center' }]}>Permissão Negada</Text>
            <Text style={styles.modalMsg}>É necessário conceder permissão de localização para usar este recurso.</Text>
            <TouchableOpacity style={[styles.btnPrimary, { alignSelf: 'stretch', alignItems: 'center', backgroundColor: COLORS.error }]}
              onPress={() => setShowPermissionDeniedModal(false)}>
              <Text style={styles.btnWhiteText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Current Location Confirmation Modal ── */}
      <Modal visible={showCurrentLocationModal} transparent animationType="fade" onRequestClose={() => setShowCurrentLocationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.centeredModalCard]}>
            <View style={[styles.modalIconRing, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="locate" size={36} color={COLORS.primary} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Localização Atual</Text>
            <Text style={styles.modalMsg}>Deseja usar a sua localização atual? As coordenadas serão obtidas automaticamente.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCurrentLocationModal(false)} style={styles.btnOutline}><Text style={styles.btnPrimaryText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.btnPrimary}>
                <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 4 }} />
                <Text style={styles.btnWhiteText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Success Location Modal ── */}
      <Modal visible={showSuccessLocationModal} transparent animationType="fade" onRequestClose={() => setShowSuccessLocationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.centeredModalCard]}>
            <LinearGradient colors={[COLORS.primary, '#02a882']} style={styles.modalIconRing}>
              <Ionicons name="checkmark" size={36} color="white" />
            </LinearGradient>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Sucesso!</Text>
            <Text style={styles.modalMsg}>{successLocationMessage}</Text>
            <TouchableOpacity style={[styles.btnPrimary, { alignSelf: 'stretch', alignItems: 'center' }]}
              onPress={() => setShowSuccessLocationModal(false)}>
              <Text style={styles.btnWhiteText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Loading Location Modal ── */}
      <Modal visible={showLoadingLocationModal} transparent animationType="none" onRequestClose={() => {}}>
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Obtendo localização...</Text>
            <Text style={styles.loadingSubtext}>Por favor, aguarde</Text>
          </View>
        </View>
      </Modal>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 18 : 16) }]}>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit, (errs) => {
            try {
              const keys = Object.keys(errs || {});
              const firstKey = keys[0];
              const allErrors = keys.map((k) => ({ field: k, message: (errs as any)[k]?.message })).filter((e) => !!e.message);
              const y = firstKey ? fieldPositions[firstKey] : undefined;
              if (typeof y === 'number' && scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(y - 12, 0), animated: true });
              const list = allErrors.slice(0, 6).map((e) => `• ${e.field === 'numeroDocumento' ? 'Nº do BI' : e.field}: ${e.message}`).join('\n');
              Alert.alert('Campos em falta', list || 'Verifique os campos obrigatórios destacados antes de continuar.');
            } catch (err) { Alert.alert('Campos em falta', 'Verifique os campos obrigatórios destacados antes de continuar.'); }
          })}
          style={styles.footerBtn}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={isLoading ? ['#aaa', '#aaa'] : [COLORS.primary, '#02a882']} style={styles.footerBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {!isLoading && <Ionicons name="arrow-forward-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />}
            <Text style={styles.footerBtnText}>{isLoading ? 'Processando...' : 'Continuar'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, minHeight: '100vh' as any },
  scroll: { flex: 1 },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backButtonHeader: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },

  // ── Content ─────────────────────────────────────────────
  content: { padding: 16, flexGrow: 1, paddingBottom: 140 },

  // ── Section card ────────────────────────────────────────
  card: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#1a1a2e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  cardAccent: { backgroundColor: COLORS.secondaryLight, borderWidth: 1, borderColor: COLORS.secondary + '30' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cardIconContainer: { width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardIconContainerAccent: { backgroundColor: COLORS.secondaryLight },
  cardIcon: { fontSize: 20 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 },

  // ── Typography ───────────────────────────────────────────
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.2 },
  helperText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 18 },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: -6, marginBottom: 10 },
  tapHint: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 4, marginBottom: 6 },

  // ── Info badge ───────────────────────────────────────────
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, marginTop: -6, marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary + '20',
  },
  infoBadgeText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  // ── Radio ────────────────────────────────────────────────
  radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  radioCard: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.white },
  radioCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  radioIndicator: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  radioIndicatorSelected: { borderColor: COLORS.primary },
  radioIndicatorInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  radioLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  radioLabelSelected: { color: COLORS.primary, fontWeight: '700' },

  // ── Row ──────────────────────────────────────────────────
  rowFields: { flexDirection: 'row', gap: 10 },

  // ── Table ────────────────────────────────────────────────
  tableHeader: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, backgroundColor: COLORS.primaryLight, borderRadius: 10, marginBottom: 6 },
  th: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 10, borderRadius: 9, marginBottom: 4, backgroundColor: COLORS.white },
  tableRowAlt: { backgroundColor: COLORS.background },
  td: { flex: 1 },
  cellText: { fontSize: 13, color: COLORS.text },
  addButton: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 11 },
  addButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // ── Location / coords ────────────────────────────────────
  coordsCard: { backgroundColor: COLORS.background, borderRadius: 13, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  coordsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  coordsIconWrap: { width: 30, height: 30, borderRadius: 9, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  coordsTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text },
  coordsBody: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 9, padding: 12 },
  coordItem: { flex: 1, alignItems: 'center' },
  coordLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 2, letterSpacing: 0.5 },
  coordValue: { fontSize: 14, fontWeight: '600', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  coordDivider: { width: 1, height: 22, backgroundColor: COLORS.border, marginHorizontal: 8 },
  geoErrorBox: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#ffebee', borderWidth: 1, borderColor: COLORS.error + '25', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, marginTop: 2, marginBottom: 10 },
  geoErrorText: { flex: 1, fontSize: 12, color: COLORS.error, fontWeight: '600', lineHeight: 17 },
  locationBtns: { gap: 10, marginTop: 12 },
  locBtn: { borderRadius: 12, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  locBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 8 },
  locBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
  locBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.white, shadowColor: 'transparent', elevation: 0 },
  locBtnTextOutline: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginLeft: 6 },
  locationSearchWrap: { marginBottom: 6 },
  selectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
    marginTop: -8,
    marginBottom: 12,
  },
  selectedLocationText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.primary },
  locationResults: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    marginTop: -8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  locationResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locationResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  locationResultTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  locationResultSubtitle: { fontSize: 12, color: COLORS.textSecondary },

  // ── Photo ────────────────────────────────────────────────
  photoPreviewWrap: { alignItems: 'center', marginVertical: 10 },
  photoPreview: { width: 200, height: 150, resizeMode: 'cover', borderRadius: 12 },
  removePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.error, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10, marginTop: 10 },
  removePhotoBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  photoBtn: { borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary, overflow: 'hidden' },
  photoBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 8, backgroundColor: COLORS.primaryLight },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // ── Signature ────────────────────────────────────────────
  signaturePreviewBlock: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 10, marginBottom: 8 },
  signaturePreview: { width: '100%', height: 160, backgroundColor: COLORS.white, borderRadius: 8 },
  signBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondary, paddingVertical: 13, borderRadius: 12 },
  signBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // ── Info/docs card ───────────────────────────────────────
  infoCard: { backgroundColor: COLORS.secondaryLight, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.secondary + '30' },
  docList: { marginTop: 6 },
  docItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  docDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  docText: { fontSize: 14, color: COLORS.text },

  // ── Shared button variants ───────────────────────────────
  btnPrimary: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 11 },
  btnOutline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 11, backgroundColor: COLORS.white },
  btnDanger: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, backgroundColor: COLORS.error, borderRadius: 11 },
  btnWhiteText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // ── Modal ────────────────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 500, backgroundColor: COLORS.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10 },
  centeredModalCard: { alignItems: 'center' },
  modalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  modalIconRing: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalMsg: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 20 },

  // ── Search ───────────────────────────────────────────────
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 11, paddingHorizontal: 12, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  searchStateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  searchStateText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  searchResultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchResultTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  searchResultSub: { fontSize: 12, color: COLORS.textSecondary },

  // ── Coord input ──────────────────────────────────────────
  coordInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // ── Loading modal ────────────────────────────────────────
  loadingBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loadingCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 32, minWidth: 260, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  loadingText: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 14, textAlign: 'center' },
  loadingSubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },

  // ── Map picker ──────────────────────────────────────────
  mapModalRoot: { flex: 1, backgroundColor: COLORS.white },
  mapModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mapHeaderBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  mapModalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  mapModalSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  mapView: { flex: 1 },
  mapBottomSheet: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
  mapNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 11, backgroundColor: COLORS.primaryLight, marginBottom: 10 },
  mapNoticeText: { flex: 1, fontSize: 12, lineHeight: 17, color: COLORS.primary, fontWeight: '600' },
  mapAddressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  mapAddressTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  mapAddressSub: { fontSize: 12, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  mapConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary },
  mapConfirmBtnDisabled: { opacity: 0.5 },
  mapConfirmText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // ── Footer ──────────────────────────────────────────────
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerBtn: { borderRadius: 15, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  footerBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  footerBtnText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: -0.2 },
});
