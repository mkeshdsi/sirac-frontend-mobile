import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar, TouchableOpacity, Platform, Modal, Image, TextInput, ActivityIndicator } from 'react-native';
import ReactNative from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Input, Card, Select } from '@/components';
import SignaturePadModal from '@/components/SignaturePadModal';
import { MOZ_BANKS } from '@/components/constants/moz_banks';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, CommercialData } from '@/types';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { listAngariadores, listAprovadores, listValidadores, createAdesao } from '@/services/apiResources';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';

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
// Regex estrito para prefixos 82 ou 83 (com ou sem 258)
const phoneRegex = /^(258)?(82|83)\d{7}$/;

// Normaliza contactos: mantém apenas dígitos
const normalizePhone = (s?: string) => (s ? s.replace(/[^0-9]/g, '') : '');

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
  // Add new fields for agent contact and document identification
  contactoAgente: yup.string().optional().test('tel', 'Deve começar com 82 ou 83 (9 dígitos)', (v) => !v || phoneRegex.test(v)),
  tipoDocumento: yup.string().oneOf(['BI', 'PASSAPORTE', 'CARTAO_ELEITOR', 'CARTA_CONDUCAO'], 'Tipo de documento inválido').optional(),
  numeroDocumento: yup.string().optional(),
  alvara: yup.string()
    .when(['tipoParceiro', 'tipoDocumento'], {
      is: (tipoParceiro: string, tipoDocumento: string) =>
        tipoParceiro === 'MERCHANT' || tipoDocumento === 'CARTA_CONDUCAO',
      then: (s) => s.required('Número do alvará/licença é obrigatório'),
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
  telefone: yup.string().optional().test('tel', 'Deve começar com 82 ou 83', (v) => !v || phoneRegex.test(v)),
  celular: yup.string().optional().test('cel', 'Deve começar com 82 ou 83', (v) => !v || phoneRegex.test(v)),
  proprietarioContacto: yup.string().optional().test('propcont', 'Deve começar com 82 ou 83', (v) => !v || phoneRegex.test(v)),
  assistentes: yup
    .array(
      yup.object({
        nomeCompleto: yup
          .string()
          .required('Nome do assistente é obrigatório')
          .min(2, 'Nome do assistente muito curto'),
        contacto: yup
          .string()
          .optional()
          .test('ass-contact', 'Deve começar com 82 ou 83', (v) => !v || phoneRegex.test(v)),
      })
    )
    .optional(),
  proprietarios: yup
    .array(
      yup.object({
        nome: yup.string().optional(),
        email: yup.string().optional().email('Email inválido'),
        contacto: yup.string().optional().test('prop-contact', 'Deve começar com 82 ou 83', (v) => !v || phoneRegex.test(v)),
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
  latitude: yup.number().nullable(),
  longitude: yup.number().nullable(),
  fotografia: yup.string().optional(),
}) as any;

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
    // Exigir pelo menos nome completo para cumprir o backend (nome_completo é obrigatório)
    const cleanedName = (temp.nomeCompleto || '').replace(/\s+/g, ' ').trim();
    if (!cleanedName || cleanedName.length < 2) {
      Alert.alert('Assistente', 'Informe o Nome Completo do assistente.');
      return;
    }
    if (editIndex === null) append({ ...temp, nomeCompleto: cleanedName }); else update(editIndex, { ...temp, nomeCompleto: cleanedName });
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
            <Input
              label="Nome Completo"
              placeholder="Nome Completo"
              value={temp.nomeCompleto}
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={(t) => {
                // Normaliza espaços sucessivos e evita espaços à esquerda enquanto digita
                const normalized = t.replace(/\s+/g, ' ').replace(/^\s+/, '');
                setTemp((s) => ({ ...s, nomeCompleto: normalized }));
              }}
            />
            <Input
              label="Contacto"
              placeholder="Contacto"
              keyboardType="phone-pad"
              maxLength={9}
              value={temp.contacto}
              onChangeText={(t) => setTemp((s) => ({ ...s, contacto: normalizePhone(t).slice(0, 9) }))}
            />
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
            <Input
              label="Contacto"
              placeholder="Contacto"
              keyboardType="phone-pad"
              maxLength={9}
              value={temp.contacto}
              onChangeText={(t) => setTemp((s) => ({ ...s, contacto: normalizePhone(t).slice(0, 9) }))}
            />
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [fieldPositions, setFieldPositions] = useState<Record<string, number>>({});
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, trigger, getValues } = useForm<CommercialData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      tipoParceiro: 'MERCHANT',
      nomeComercial: '',
      nuit: '',
      alvara: '',
      tipoEmpresa: undefined as any,
      proprietarioNomeCompleto: '',
      proprietarioContacto: '',
      assistentes: [],
      proprietarios: [],
      estabelecimentos: [],
    },
  });
  const tipoParceiro = useWatch({ control, name: 'tipoParceiro' });
  const tipoDocumento = useWatch({ control, name: 'tipoDocumento' });
  const fotografiaValue = useWatch({ control, name: 'fotografia' });
  const [bankMode, setBankMode] = useState<'lista' | 'outro'>('lista');
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location.LocationGeocodedAddress[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // State for custom modals
  const [showLocationMethodModal, setShowLocationMethodModal] = useState(false);
  const [showCoordinateInputModal, setShowCoordinateInputModal] = useState(false);
  const [showCurrentLocationModal, setShowCurrentLocationModal] = useState(false);
  const [showLoadingLocationModal, setShowLoadingLocationModal] = useState(false);
  const [coordinateInput, setCoordinateInput] = useState('');
  const [showErrorModal, setShowErrorModal] = useState('');
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false);

  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      // Show confirmation modal instead of requesting permission immediately
      setShowCurrentLocationModal(true);
    } catch (error) {
      console.error('Error preparing location request:', error);
      setShowErrorModal('Falha ao preparar obtenção de localização. Tente novamente.');
    }
  };

  // Function to actually get the current location
  const handleGetCurrentLocation = async () => {
    setShowCurrentLocationModal(false);
    setShowLoadingLocationModal(true); // Mostrar modal de carregamento

    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowLoadingLocationModal(false); // Ocultar modal de carregamento
        setShowPermissionDeniedModal(true);
        return;
      }

      // Get current position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Set the coordinates in the form
      setValue('latitude', location.coords.latitude);
      setValue('longitude', location.coords.longitude);

      setShowLoadingLocationModal(false); // Ocultar modal de carregamento
      Alert.alert('✅ Sucesso', `Localização obtida: ${location.coords.latitude}, ${location.coords.longitude}`);
    } catch (error) {
      console.error('Error getting location:', error);
      setShowLoadingLocationModal(false); // Ocultar modal de carregamento
      setShowErrorModal('Falha ao obter localização. Tente novamente.');
    }
  };

  // Function to get current location

  // Function to take photo of the banca
  const takePhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permissão negada', 'É necessário conceder permissão para usar a câmera.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // Fix deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.1, // Reduzido drasticamente para evitar erro 413 (Payload Too Large)
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        console.log(`[CommercialDataForm] Foto capturada (URI: ${uri})`);
        setValue('fotografia', uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Falha ao tirar foto. Tente novamente.');
    }
  };

  // Function to search for locations
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        // Get detailed address information for the first result
        const addressResults = await Location.reverseGeocodeAsync(results[0]);
        setSearchResults(addressResults);
      } else {
        setSearchResults([]);
        Alert.alert('🔍 Nenhum resultado', 'Nenhuma localização encontrada para a pesquisa.');
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      Alert.alert('❌ Erro', 'Falha ao pesquisar localizações. Tente novamente.');
    }
  };

  // Function to select a location from search results
  const selectLocation = (location: Location.LocationGeocodedAddress) => {
    try {
      // Get coordinates from the selected location
      // We need to geocode again to get precise coordinates
      Location.geocodeAsync(`${location.street}, ${location.city}, ${location.region}`)
        .then(coords => {
          if (coords.length > 0) {
            const { latitude, longitude } = coords[0];
            setValue('latitude', latitude);
            setValue('longitude', longitude);
            setSearchResults([]);
            setShowSearch(false);
            setSearchQuery('');
            Alert.alert('✅ Localização selecionada', `${latitude}, ${longitude}`);
          }
        })
        .catch(error => {
          console.error('Error getting coordinates:', error);
          Alert.alert('❌ Erro', 'Falha ao obter coordenadas da localização selecionada.');
        });
    } catch (error) {
      console.error('Error selecting location:', error);
      Alert.alert('❌ Erro', 'Falha ao selecionar localização.');
    }
  };

  // Function to open Google Maps for location selection with coordinate capture
  const openMapsForLocation = async () => {
    try {
      // Request location permission first
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowPermissionDeniedModal(true);
        return;
      }

      // Get current position to center the map
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Show custom modal instead of system alert
      setShowLocationMethodModal(true);
    } catch (error) {
      console.error('Error opening maps:', error);
      setShowErrorModal('Falha ao abrir o Google Maps. Tente novamente.');
    }
  };

  // Function to handle location method selection
  const handleLocationMethod = async (method: 'search' | 'maps') => {
    setShowLocationMethodModal(false);

    if (method === 'search') {
      setShowSearch(true);
    } else {
      // Open Google Maps
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const url = `https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}&center=${location.coords.latitude},${location.coords.longitude}&zoom=15`;
      await WebBrowser.openBrowserAsync(url);

      // Show coordinate input modal after delay
      setTimeout(() => {
        setShowCoordinateInputModal(true);
      }, 1000);
    }
  };

  // Function to handle coordinate input submission
  const handleCoordinateSubmit = () => {
    if (coordinateInput) {
      const cleanedCoords = coordinateInput.replace(/\s/g, '');
      const [latStr, lngStr] = cleanedCoords.split(',');

      if (latStr && lngStr) {
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (!isNaN(lat) && !isNaN(lng)) {
          setValue('latitude', lat);
          setValue('longitude', lng);
          setShowCoordinateInputModal(false);
          setCoordinateInput('');
          Alert.alert('✅ Sucesso', `Coordenadas definidas: ${lat}, ${lng}`);
        } else {
          setShowErrorModal('Formato de coordenadas inválido. Use: latitude,longitude');
        }
      } else {
        setShowErrorModal('Formato inválido. Use: latitude,longitude');
      }
    }
  };

  // Function to open Google Maps for location selection with coordinate capture

  const handleLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Regista a posição Y de cada campo para possibilitar scroll até ao primeiro erro
  const onLayoutField = (name: keyof CommercialData | string) => (e: any) => {
    const y = e?.nativeEvent?.layout?.y ?? 0;
    setFieldPositions((s) => ({ ...s, [String(name)]: y }));
  };

  useEffect(() => {
    // Preenche a data do formulário por omissão se estiver vazia
    (async () => {
      const ok = await trigger('dataFormulario');
      // Se vazio/inválido, define hoje
      setValue('dataFormulario', formatDate(new Date()), { shouldValidate: true });
    })();
  }, []);

  // Define um default para tipoEmpresa quando MERCHANT
  useEffect(() => {
    if (tipoParceiro === 'MERCHANT') {
      const current = getValues('tipoEmpresa');
      if (!current) {
        setValue('tipoEmpresa', 'SOCIEDADE', { shouldValidate: true });
      }
    } else {
      // Não obrigatório quando AGENTE
      setValue('tipoEmpresa', undefined as any, { shouldValidate: false });
    }
  }, [tipoParceiro]);

  const onSubmit = async (data: CommercialData) => {
    // Não enviar para a API aqui. O envio correto é feito na ReviewSubmitScreen,
    // onde os campos são mapeados para o formato do backend (assinatura_adesao, data_adesao, etc.).
    try {
      setIsLoading(true);
      console.log('[CommercialDataForm] Dados comerciais (pré-upload docs):', data);
      navigation.navigate('DocumentUpload', { commercialData: data });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>FORMULÁRIO DE ADESÃO</Text>
            <Text style={styles.headerSubtitle}>Preencha as informações do parceiro</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              accessibilityRole="button"
              accessibilityLabel="Sair"
              activeOpacity={0.85}
            >
              <View style={styles.logoutContent}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                <Text style={styles.logoutText}>Sair</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator>


        {/* CONTACTO DO AGENTE E DOCUMENTO DE IDENTIFICAÇÃO */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👤</Text>
            </View>
            <Text style={styles.cardTitle}>Dados do Agente</Text>
          </View>
          <View onLayout={onLayoutField('contactoAgente')}>
            <Controller control={control} name="contactoAgente" render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Contacto do Agente"
                placeholder="Contacto do Agente"
                keyboardType="phone-pad"
                maxLength={9}
                value={value}
                onChangeText={(t) => onChange(normalizePhone(t).slice(0, 9))}
                onBlur={onBlur}
                error={errors.contactoAgente?.message}
              />
            )} />
          </View>

          <View onLayout={onLayoutField('tipoDocumento')}>
            <Text style={[styles.helperText, { marginBottom: 8 }]}>Tipo de Documento</Text>
            <Controller
              control={control}
              name="tipoDocumento"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Selecionar tipo de documento"
                  placeholder="Selecionar tipo de documento"
                  value={value || (null as any)}
                  onChange={onChange}
                  errorText={errors.tipoDocumento?.message}
                  options={[
                    { id: 'BI', label: 'BI' },
                    { id: 'PASSAPORTE', label: 'Passaporte' },
                    { id: 'CARTAO_ELEITOR', label: 'Cartão de Eleitor' },
                    { id: 'CARTA_CONDUCAO', label: 'Carta de Condução' },
                  ]}
                />
              )}
            />
          </View>

          <View onLayout={onLayoutField('numeroDocumento')}>
            <Controller control={control} name="numeroDocumento" render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Número do Documento"
                placeholder="Número do Documento"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.numeroDocumento?.message}
              />
            )} />
          </View>
        </Card>
        {/* TIPO DE PARCEIRO */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>💼</Text>
            </View>
            <Text style={styles.cardTitle}>Tipo de Parceiro</Text>
          </View>
          <Controller
            control={control}
            name="tipoParceiro"
            render={({ field: { onChange, value } }) => (
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  onPress={() => onChange('MERCHANT')}
                  style={[styles.radioCard, value === 'MERCHANT' && styles.radioCardSelected]}
                >
                  <View style={[styles.radioIndicator, value === 'MERCHANT' && styles.radioIndicatorSelected]}>
                    {value === 'MERCHANT' && <View style={styles.radioIndicatorInner} />}
                  </View>
                  <Text style={[styles.radioLabel, value === 'MERCHANT' && styles.radioLabelSelected]}>MERCHANT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onChange('AGENTE')}
                  style={[styles.radioCard, value === 'AGENTE' && styles.radioCardSelected]}
                >
                  <View style={[styles.radioIndicator, value === 'AGENTE' && styles.radioIndicatorSelected]}>
                    {value === 'AGENTE' && <View style={styles.radioIndicatorInner} />}
                  </View>
                  <Text style={[styles.radioLabel, value === 'AGENTE' && styles.radioLabelSelected]}>AGENTE</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </Card>
        {/* DADOS EMPRESA */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🏢</Text>
            </View>
            <Text style={styles.cardTitle}>DADOS EMPRESA</Text>
          </View>
          <View onLayout={onLayoutField('nuit')}>
            <Controller control={control} name="nuit" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="NUIT" placeholder="123456789" keyboardType="numeric" maxLength={9} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nuit?.message} required />
            )} />
          </View>

          <View onLayout={onLayoutField('nuit')}>
            <Controller control={control} name="alvara" render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Número do Alvará/Licença"
                placeholder="Ex: 123/2024"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.alvara?.message}
                required={tipoParceiro === 'MERCHANT' || tipoDocumento === 'CARTA_CONDUCAO'}
              />
            )} />
          </View>

          <View onLayout={onLayoutField('nomeComercial')}>
            <Controller control={control} name="nomeComercial" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Nome Comercial" placeholder="Nome do negócio" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.nomeComercial?.message} required />
            )} />
          </View>

          <View onLayout={onLayoutField('tipoEmpresa')}>
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
          </View>
          {!!errors.tipoEmpresa?.message && <Text style={styles.errorText}>{errors.tipoEmpresa.message}</Text>}
          <Controller control={control} name="designacao" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Designação" placeholder="Designação da empresa" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="naturezaObjecto" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Natureza e objecto da actividade" placeholder="Ex: Comércio de ..." value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller
            control={control}
            name="banco"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                {tipoParceiro === 'MERCHANT' && (
                  <>
                    <Text style={[styles.helperText, { marginBottom: 8 }]}>Banco</Text>
                    <Select
                      label="Selecionar banco"
                      // Se estiver em modo 'outro', mantemos o Select marcado em 'Outro' para o utilizador ver a seleção
                      value={(bankMode === 'outro' ? 'Outro' : (value as any)) || (null as any)}
                      onChange={(val: any) => {
                        const found = MOZ_BANKS.find((b) => String(b.id) === String(val) || b.label === val);
                        if (String(val) === 'Outro' || found?.label === 'Outro') {
                          setBankMode('outro');
                          onChange(''); // limpar para exigir preenchimento manual
                        } else {
                          setBankMode('lista');
                          onChange(found?.label ?? String(val));
                        }
                      }}
                      options={MOZ_BANKS}
                    />
                    {bankMode === 'outro' && (
                      <Input
                        label="Digite o nome do banco"
                        placeholder="Digite o nome do banco"
                        value={typeof value === 'string' ? value : ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        required={true}
                        error={errors.banco?.message}
                      />
                    )}
                  </>
                )}
              </View>
            )}
          />
          {tipoParceiro === 'MERCHANT' && (
            <Controller control={control} name="numeroConta" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Nº da Conta" placeholder="0000000000" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
          )}
          {/* Profissão dentro de Dados Empresa */}
          <Controller control={control} name="profissao" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Profissão" placeholder="Profissão" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        </Card>

        {/* Endereço */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📍</Text>
            </View>
            <Text style={styles.cardTitle}>Endereço</Text>
          </View>
          <View onLayout={onLayoutField('enderecoCidade')}>
            <Controller control={control} name="enderecoCidade" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Cidade" placeholder="Ex: Maputo" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.enderecoCidade?.message} required />
            )} />
          </View>
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
                <Input
                  label="Telefone"
                  placeholder="Telefone"
                  keyboardType="phone-pad"
                  maxLength={9}
                  value={value}
                  onChangeText={(t) => onChange(normalizePhone(t).slice(0, 9))}
                  onBlur={onBlur}
                />
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="celular" render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Celular"
                  placeholder="Celular"
                  keyboardType="phone-pad"
                  maxLength={9}
                  value={value}
                  onChangeText={(t) => onChange(normalizePhone(t).slice(0, 9))}
                  onBlur={onBlur}
                />
              )} />
            </View>
          </View>
        </Card>

        {/* Banca (for all partner types) */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📍</Text>
            </View>
            <Text style={styles.cardTitle}>Localização da Banca</Text>
          </View>

          {/* Location coordinates */}
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="latitude" render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Latitude"
                  placeholder="Será preenchido"
                  editable={false}
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : null)}
                  onBlur={onBlur}
                />
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="longitude" render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Longitude"
                  placeholder="automaticamente"
                  editable={false}
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : null)}
                  onBlur={onBlur}
                />
              )} />
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <TouchableOpacity onPress={openMapsForLocation} style={[styles.modalButton, styles.modalPrimary]}>
              <Text style={styles.modalButtonText}>Abrir Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={getCurrentLocation} style={[styles.modalButton, styles.modalOutline, { marginTop: 10 }]}>
              <Text style={styles.modalButtonTextOutline}>Usar Localização Atual</Text>
            </TouchableOpacity>
          </View>

          {/* Photo of the banca (optional for all partner types) */}
          <View style={{ marginTop: 15 }}>
            <Text style={styles.helperText}>Fotografia da Banca (opcional)</Text>
            {fotografiaValue ? (
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <Image source={{ uri: fotografiaValue }} style={{ width: 200, height: 200, resizeMode: 'cover', borderRadius: 8 }} />
                <TouchableOpacity
                  onPress={() => setValue('fotografia', '')}
                  style={[styles.modalButton, styles.modalDanger, { marginTop: 10 }]}
                >
                  <Text style={styles.modalButtonText}>Remover Foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={takePhoto} style={[styles.modalButton, styles.modalWarning]}>
                <Text style={styles.modalButtonText}>Tirar Foto da Banca</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Estabelecimentos (antes de Assistentes) */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🏪</Text>
            </View>
            <Text style={styles.cardTitle}>Estabelecimentos</Text>
          </View>
          <EstabelecimentosFieldArray control={control} />
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

        {/* Assinatura e Data (antes de Proprietários) */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>✍️</Text>
            </View>
            <Text style={styles.cardTitle}>Assinatura e Data</Text>
          </View>
          <View onLayout={onLayoutField('assinatura')}>
            <Controller
              control={control}
              name="assinatura"
              render={({ field: { value, onChange } }) => (
                <View>
                  {value ? (
                    <View style={styles.signaturePreviewBlock}>
                      <ReactNative.Image
                        source={{ uri: value }}
                        style={styles.signaturePreview}
                        resizeMode="contain"
                      />
                      <View style={{ height: 8 }} />
                      <TouchableOpacity onPress={() => setShowSignature(true)} style={[styles.modalButton, styles.modalOutline]}>
                        <Text style={styles.modalButtonTextOutline}>Refazer assinatura</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setShowSignature(true)} style={[styles.modalButton, styles.modalWarning]}>
                      <Text style={[styles.modalButtonText, { textAlign: 'center' }]}>Assinar no ecrã</Text>
                    </TouchableOpacity>
                  )}
                  {!!errors.assinatura?.message && (
                    <Text style={styles.errorText}>{errors.assinatura.message}</Text>
                  )}
                  <SignaturePadModal
                    visible={showSignature}
                    onOK={(sig) => {
                      onChange(sig);
                    }}
                    onClose={() => setShowSignature(false)}
                  />
                </View>
              )}
            />
          </View>
          <View onLayout={onLayoutField('dataFormulario')}>
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
          </View>
        </Card>

        {/* Dados dos Proprietários */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👥</Text>
            </View>
            <Text style={styles.cardTitle}>Dados dos Proprietários</Text>
          </View>
          <ProprietariosFieldArray control={control} />
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

      {/* Location Search Modal */}
      <Modal visible={showSearch} transparent animationType="slide" onRequestClose={() => setShowSearch(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pesquisar Localização</Text>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite o endereço ou nome do local"
                  value={searchQuery}
                  onChangeText={(text: string) => {
                    setSearchQuery(text);
                    if (text.length > 2) {
                      searchLocations(text);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                />
              </View>

              {searchResults.length > 0 && (
                <ScrollView style={styles.searchResultsContainer}>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => selectLocation(result)}
                    >
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultTitle}>
                          {result.name || result.street || 'Localização'}
                        </Text>
                        <Text style={styles.searchResultSubtitle}>
                          {[
                            result.street,
                            result.city,
                            result.region,
                            result.country
                          ].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {searchQuery.length > 0 && searchResults.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>Nenhum resultado encontrado</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Modals */}

      {/* Location Method Selection Modal */}
      <Modal
        visible={showLocationMethodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationMethodModal(false)}
      >
        <View style={styles.customModalBackdrop}>
          <View style={styles.customModalCard}>
            <View style={styles.customModalHeader}>
              <Text style={styles.customModalTitle}>📍 Selecionar Localização</Text>
              <TouchableOpacity
                onPress={() => setShowLocationMethodModal(false)}
                style={styles.customModalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.customModalContent}>
              <Text style={styles.customModalDescription}>
                Escolha como deseja selecionar a localização da banca:
              </Text>

              <View style={styles.customModalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonPrimary]}
                  onPress={() => handleLocationMethod('search')}
                >
                  <Ionicons name="search" size={20} color={COLORS.white} />
                  <Text style={styles.customModalButtonText}>Pesquisar Endereço</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonSecondary]}
                  onPress={() => handleLocationMethod('maps')}
                >
                  <Ionicons name="map" size={20} color={COLORS.primary} />
                  <Text style={styles.customModalButtonTextSecondary}>Usar Google Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Coordinate Input Modal */}
      <Modal
        visible={showCoordinateInputModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCoordinateInputModal(false)}
      >
        <View style={styles.customModalBackdrop}>
          <View style={styles.customModalCard}>
            <View style={styles.customModalHeader}>
              <Text style={styles.customModalTitle}>📍 Inserir Coordenadas</Text>
              <TouchableOpacity
                onPress={() => setShowCoordinateInputModal(false)}
                style={styles.customModalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.customModalContent}>
              <Text style={styles.customModalDescription}>
                Cole as coordenadas copiadas do Google Maps:
              </Text>

              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customTextInput}
                  placeholder="Ex: -25.9667,32.5833"
                  value={coordinateInput}
                  onChangeText={setCoordinateInput}
                  keyboardType="numbers-and-punctuation"
                  autoFocus
                />
              </View>

              <View style={styles.customModalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonOutline]}
                  onPress={() => setShowCoordinateInputModal(false)}
                >
                  <Text style={styles.customModalButtonTextOutline}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonPrimary]}
                  onPress={handleCoordinateSubmit}
                >
                  <Text style={styles.customModalButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={!!showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal('')}
      >
        <View style={styles.customModalBackdrop}>
          <View style={[styles.customModalCard, styles.customModalError]}>
            <View style={styles.customModalContentCentered}>
              <View style={styles.customModalIconContainer}>
                <Ionicons name="alert-circle" size={48} color={COLORS.error} />
              </View>
              <Text style={styles.customModalErrorTitle}>Erro</Text>
              <Text style={styles.customModalErrorMessage}>{showErrorModal}</Text>
              <TouchableOpacity
                style={[styles.customModalButton, styles.customModalButtonPrimary]}
                onPress={() => setShowErrorModal('')}
              >
                <Text style={styles.customModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Permission Denied Modal */}
      <Modal
        visible={showPermissionDeniedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionDeniedModal(false)}
      >
        <View style={styles.customModalBackdrop}>
          <View style={[styles.customModalCard, styles.customModalError]}>
            <View style={styles.customModalContentCentered}>
              <View style={styles.customModalIconContainer}>
                <Ionicons name="lock-closed" size={48} color={COLORS.error} />
              </View>
              <Text style={styles.customModalErrorTitle}>Permissão Negada</Text>
              <Text style={styles.customModalErrorMessage}>
                É necessário conceder permissão de localização para usar este recurso.
              </Text>
              <TouchableOpacity
                style={[styles.customModalButton, styles.customModalButtonPrimary]}
                onPress={() => setShowPermissionDeniedModal(false)}
              >
                <Text style={styles.customModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Current Location Confirmation Modal */}
      <Modal
        visible={showCurrentLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrentLocationModal(false)}
      >
        <View style={styles.customModalBackdrop}>
          <View style={styles.customModalCard}>
            <View style={styles.customModalHeader}>
              <Text style={styles.customModalTitle}>📍 Usar Localização Atual</Text>
              <TouchableOpacity
                onPress={() => setShowCurrentLocationModal(false)}
                style={styles.customModalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.customModalContentCentered}>
              <View style={styles.customModalIconContainer}>
                <Ionicons name="locate" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.customModalSuccessTitle}>Localização Atual</Text>
              <Text style={styles.customModalSuccessMessage}>
                Deseja usar sua localização atual?
                Esta ação obterá sua latitude e longitude automaticamente.
              </Text>
              <View style={styles.customModalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonOutline]}
                  onPress={() => setShowCurrentLocationModal(false)}
                >
                  <Text style={styles.customModalButtonTextOutline}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonPrimary]}
                  onPress={handleGetCurrentLocation}
                >
                  <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  <Text style={styles.customModalButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Location Modal */}
      <Modal
        visible={showLoadingLocationModal}
        transparent
        animationType="none"
        onRequestClose={() => { }}
      >
        <View style={styles.loadingModalBackdrop}>
          <View style={styles.loadingModalCard}>
            <View style={styles.loadingModalContent}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingModalText}>Obtendo localização...</Text>
              <Text style={styles.loadingModalSubtext}>Por favor, aguarde</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer com botão Continuar */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit, (errs) => {
            try {
              const keys = Object.keys(errs || {});
              const firstKey = keys[0];
              const firstMsg = firstKey && (errs as any)[firstKey]?.message;
              // Log completo dos erros
              const allErrors = keys
                .map((k) => ({ field: k, message: (errs as any)[k]?.message }))
                // Excluir itens sem mensagem (ex.: arrays como 'assistentes' sem erro de nível raiz)
                .filter((e) => !!e.message);
              console.log('[CommercialDataForm] Erros de validação:', allErrors);
              // Scroll até o primeiro campo com erro (se mapeado)
              const y = firstKey ? fieldPositions[firstKey] : undefined;
              if (typeof y === 'number' && scrollRef.current) {
                scrollRef.current.scrollTo({ y: Math.max(y - 12, 0), animated: true });
              }
              // Mostrar todas as mensagens no Alert (até um limite razoável)
              const list = allErrors.slice(0, 6).map((e) => `• ${e.field}: ${e.message}`).join('\n');
              Alert.alert(
                'Campos em falta',
                list || firstMsg || 'Verifique os campos obrigatórios destacados antes de continuar.'
              );
            } catch (err) {
              Alert.alert('Campos em falta', 'Verifique os campos obrigatórios destacados antes de continuar.');
            }
          })}
          style={[styles.footerButtonPrimary, { flex: 1 }]}
          disabled={isLoading}
        >
          <View style={styles.inlineRowCenter}>
            <Text style={styles.footerButtonPrimaryText}>
              {isLoading ? 'Processando...' : 'Continuar'}
            </Text>
            {!isLoading && (
              <Ionicons name="arrow-forward-outline" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // Garante altura total no Web para permitir scroll
    minHeight: '100vh' as any,
  },
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    marginLeft: 12,
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
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    marginLeft: 6,
  },
  content: {
    padding: 16,
    // FlexGrow garante que o conteúdo expande e ativa scroll quando necessário
    flexGrow: 1,
    // Maior espaço inferior para não ficar coberto pelo footer fixo
    paddingBottom: 140,
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
    marginLeft: 8,
  },
  inlineRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signaturePreviewBlock: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  signaturePreview: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.white,
  },
  modalWarning: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  searchResultsContainer: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  // Custom Modal Styles
  customModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  customModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  customModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  customModalCloseButton: {
    padding: 4,
  },
  customModalContent: {
    padding: 20,
  },
  customModalContentCentered: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customModalDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'left',
  },
  customModalButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 10,
  },
  customModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  customModalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  customModalButtonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  customModalButtonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  customModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  customModalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customModalButtonTextOutline: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customInputContainer: {
    marginBottom: 20,
  },
  customTextInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  customModalSuccess: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success + '30',
    borderWidth: 1,
  },
  customModalError: {
    backgroundColor: COLORS.error + '10',
    borderColor: COLORS.error + '30',
    borderWidth: 1,
  },
  customModalIconContainer: {
    marginBottom: 16,
  },
  customModalSuccessTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 8,
  },
  customModalErrorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 8,
  },
  customModalSuccessMessage: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  customModalErrorMessage: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },

  // Loading Modal Styles
  loadingModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingModalContent: {
    alignItems: 'center',
  },
  loadingModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingModalSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});