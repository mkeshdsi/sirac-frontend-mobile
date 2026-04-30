import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '@/components';
import { Theme } from '@/constants/theme';
import { cadastrarAngariador } from '@/services/apiResources';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

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

const schema = yup.object({
  nome: yup.string().required('Nome Completo é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  msisdn: yup.string()
    .matches(/^\d{9}$/, 'O contacto deve ter exatamente 9 dígitos')
    .required('Contacto é obrigatório'),
  bi: yup.string()
    .required('Nº do BI é obrigatório')
    .test('len', 'O BI deve ter exatamente 13 caracteres', val => val ? val.length === 13 : false)
    .test('numbers', 'Os primeiros 12 caracteres devem ser números', val => val ? /^\d{12}/.test(val) : false)
    .test('letter', 'O 13º caracter deve ser uma letra. Não pode ser número.', val => val ? /[a-zA-Z]$/.test(val) : false),
  password: yup.string().min(6, 'Mínimo de 6 caracteres').required('Palavra-passe é obrigatória'),
  nuit: yup.string()
    .optional()
    .test('is-nine-digits', 'O NUIT deve ter exatamente 9 dígitos', value => !value || /^\d{9}$/.test(value)),
  bi_frente: yup.string().required('Anexe a imagem da frente do BI'),
  bi_verso: yup.string().required('Anexe a imagem do verso do BI'),
});

type AngariadorForm = yup.InferType<typeof schema>;

export const AngariadorDataFormScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState({ visible: false, title: '', message: '' });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AngariadorForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
      msisdn: '',
      bi: '',
      password: '',
      nuit: '',
      bi_frente: '',
      bi_verso: '',
    },
  });

  const pickImage = async (field: 'bi_frente' | 'bi_verso') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setShowErrorModal({ visible: true, title: 'Permissão Negada', message: 'Precisamos de permissão para aceder à galeria.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets[0].base64) {
      setValue(field, `data:image/jpeg;base64,${result.assets[0].base64}`, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: AngariadorForm) => {
    setLoading(true);
    try {
      const result = await cadastrarAngariador(data);
      if (result && (result.id || result.message)) {
        setShowSuccessModal(true);
      } else {
        setShowErrorModal({ visible: true, title: 'Falha no Registo', message: 'Falha ao cadastrar. Verifique os dados e tente novamente.' });
      }
    } catch (e: any) {
      console.log("Erro ao cadastrar angariador:", e?.response?.data || e.message);
      const apiMessage = e?.response?.data?.msg || e?.response?.data?.message;
      setShowErrorModal({ 
        visible: true, 
        title: 'Erro no Cadastro', 
        message: apiMessage || 'Ocorreu um erro no servidor ao cadastrar o angariador. Verifique se os dados já não existem (BI, Contacto, NUIT).'
      });
    } finally {
      setLoading(false);
    }
  };

  const onError = (errs: any) => {
    const keys = Object.keys(errs || {});
    const list = keys.slice(0, 5).map((k) => `• ${(errs as any)[k]?.message}`).join('\n');
    setShowErrorModal({ visible: true, title: 'Campos em falta', message: list || 'Verifique os campos obrigatórios e tente novamente.' });
  };

  const biFrente = watch('bi_frente');
  const biVerso = watch('bi_verso');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Novo Angariador</Text>
            <Text style={styles.headerSubtitle}>Preencha os dados e documentos</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Dados Pessoais</Text>
            </View>

            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nome Completo *"
                  placeholder="Ex: João da Silva"
                  value={value}
                  onChangeText={onChange}
                  error={errors.nome?.message}
                  leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email *"
                  placeholder="exemplo@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="msisdn"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Contacto (MSISDN) *"
                  placeholder="Ex: 840000000"
                  keyboardType="phone-pad"
                  maxLength={9}
                  value={value}
                  onChangeText={onChange}
                  error={errors.msisdn?.message}
                  leftIcon={<Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />}
                />
              )}
            />
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: COLORS.secondaryLight }]}>
                <Ionicons name="card" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.cardTitle}>Identificação e Acesso</Text>
            </View>

            <Controller
              control={control}
              name="bi"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nº do BI *"
                  placeholder="Ex: 123456789012A"
                  maxLength={13}
                  autoCapitalize="characters"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  error={errors.bi?.message}
                  leftIcon={<Ionicons name="id-card-outline" size={20} color={COLORS.textSecondary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="nuit"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="NUIT (Opcional)"
                  placeholder="Ex: 123456789"
                  keyboardType="number-pad"
                  maxLength={9}
                  value={value}
                  onChangeText={onChange}
                  error={errors.nuit?.message}
                  leftIcon={<Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Palavra-passe *"
                  placeholder="Defina uma palavra-passe inicial"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                      <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  }
                />
              )}
            />
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="images" size={20} color="#1976d2" />
              </View>
              <Text style={styles.cardTitle}>Documentos Anexos</Text>
            </View>

            <Text style={styles.sectionDescription}>Anexe as imagens claras da frente e do verso do BI do angariador.</Text>

            <View style={styles.docButtonContainer}>
              <TouchableOpacity 
                style={[styles.docButton, biFrente ? styles.docButtonSuccess : {}]} 
                onPress={() => pickImage('bi_frente')}
              >
                <Ionicons name={biFrente ? "checkmark-circle" : "camera"} size={24} color={biFrente ? COLORS.white : COLORS.primary} />
                <Text style={[styles.docButtonText, biFrente ? { color: COLORS.white } : {}]}>
                  {biFrente ? "BI Frente Anexado" : "Anexar BI Frente *"}
                </Text>
              </TouchableOpacity>
              {!!errors.bi_frente?.message && <Text style={styles.errorText}>{errors.bi_frente.message}</Text>}
            </View>

            <View style={styles.docButtonContainer}>
              <TouchableOpacity 
                style={[styles.docButton, biVerso ? styles.docButtonSuccess : {}]} 
                onPress={() => pickImage('bi_verso')}
              >
                <Ionicons name={biVerso ? "checkmark-circle" : "camera"} size={24} color={biVerso ? COLORS.white : COLORS.primary} />
                <Text style={[styles.docButtonText, biVerso ? { color: COLORS.white } : {}]}>
                  {biVerso ? "BI Verso Anexado" : "Anexar BI Verso *"}
                </Text>
              </TouchableOpacity>
              {!!errors.bi_verso?.message && <Text style={styles.errorText}>{errors.bi_verso.message}</Text>}
            </View>
          </Card>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButtonPrimary}
            onPress={handleSubmit(onSubmit, onError)}
            disabled={loading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.footerButtonPrimaryText}>
                {loading ? 'Cadastrando...' : 'Salvar Angariador'}
              </Text>
              {!loading && <Ionicons name="save-outline" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />}
            </View>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.customModalBackdrop}>
          <View style={styles.customModalCard}>
            <View style={styles.customModalContentCentered}>
              <View style={[styles.customModalIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
              </View>
              <Text style={styles.customModalTitle}>Sucesso!</Text>
              <Text style={styles.customModalMessage}>Angariador cadastrado com sucesso.</Text>
              <View style={styles.customModalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonPrimary]}
                  onPress={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.customModalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal({ visible: false, title: '', message: '' })}
      >
        <View style={styles.customModalBackdrop}>
          <View style={styles.customModalCard}>
            <View style={styles.customModalContentCentered}>
              <View style={[styles.customModalIconContainer, { backgroundColor: '#ffebee' }]}>
                <Ionicons name="alert-circle" size={56} color={COLORS.error} />
              </View>
              <Text style={[styles.customModalTitle, { color: COLORS.error }]}>{showErrorModal.title}</Text>
              <Text style={styles.customModalMessage}>{showErrorModal.message}</Text>
              <View style={styles.customModalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.customModalButton, styles.customModalButtonPrimary, { backgroundColor: COLORS.error }]}
                  onPress={() => setShowErrorModal({ visible: false, title: '', message: '' })}
                >
                  <Text style={styles.customModalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...Theme.typography.h2,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...Theme.typography.body2,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    ...Theme.typography.h3,
    color: COLORS.text,
  },
  sectionDescription: {
    ...Theme.typography.body2,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  docButtonContainer: {
    marginBottom: 12,
  },
  docButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  docButtonSuccess: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  docButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  errorText: {
    ...Theme.typography.caption,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  footerButtonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  footerButtonPrimaryText: {
    ...Theme.typography.h4,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  customModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  customModalContentCentered: {
    alignItems: 'center',
  },
  customModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  customModalTitle: {
    ...Theme.typography.h2,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  customModalMessage: {
    ...Theme.typography.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  customModalButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  customModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customModalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  customModalButtonText: {
    ...Theme.typography.h4,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
