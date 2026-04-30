import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, Text, KeyboardAvoidingView,
  Platform, TouchableOpacity, Modal, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '@/components';
import { Theme } from '@/constants/theme';
import { cadastrarAngariador } from '@/services/apiResources';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LinearGradient } from 'expo-linear-gradient';

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
    .test('letter', 'O 13º caracter deve ser uma letra', val => val ? /[a-zA-Z]$/.test(val) : false),
  password: yup.string().min(6, 'Mínimo de 6 caracteres').required('Palavra-passe é obrigatória'),
  nuit: yup.string()
    .optional()
    .test('is-nine-digits', 'O NUIT deve ter exatamente 9 dígitos', value => !value || /^\d{9}$/.test(value)),
  bi_frente: yup.string().required('Anexe a imagem da frente do BI'),
  bi_verso: yup.string().required('Anexe a imagem do verso do BI'),
});

type AngariadorForm = yup.InferType<typeof schema>;

// ── Section card wrapper ────────────────────────────────
const SectionCard = ({ icon, iconBg, iconColor, title, children }: any) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={[styles.cardIconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ── Document upload button ──────────────────────────────
const DocButton = ({ attached, onPress, label, error }: any) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <View style={styles.docButtonContainer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[styles.docButton, attached && styles.docButtonSuccess]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          {attached ? (
            <LinearGradient colors={[COLORS.primary, '#02a882']} style={styles.docButtonInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.docCheckCircle}>
                <Ionicons name="checkmark" size={14} color={COLORS.primary} />
              </View>
              <Text style={[styles.docButtonText, { color: COLORS.white }]}>{label.replace('Anexar', '')} Anexado</Text>
              <Ionicons name="swap-horizontal-outline" size={16} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          ) : (
            <View style={styles.docButtonInner}>
              <View style={styles.docCameraCircle}>
                <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.docButtonText}>{label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

// ── Main screen ─────────────────────────────────────────
export const AngariadorDataFormScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState({ visible: false, title: '', message: '' });

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<AngariadorForm>({
    resolver: yupResolver(schema),
    defaultValues: { nome: '', email: '', msisdn: '', bi: '', password: '', nuit: '', bi_frente: '', bi_verso: '' },
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
      base64: true,
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
      const apiMessage = e?.response?.data?.msg || e?.response?.data?.message;
      setShowErrorModal({
        visible: true,
        title: 'Erro no Cadastro',
        message: apiMessage || 'Ocorreu um erro no servidor. Verifique se os dados já não existem (BI, Contacto, NUIT).',
      });
    } finally {
      setLoading(false);
    }
  };

  const onError = (errs: any) => {
    const keys = Object.keys(errs || {});
    const list = keys.slice(0, 5).map(k => `• ${(errs as any)[k]?.message}`).join('\n');
    setShowErrorModal({ visible: true, title: 'Campos em falta', message: list || 'Verifique os campos obrigatórios.' });
  };

  const biFrente = watch('bi_frente');
  const biVerso = watch('bi_verso');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Novo Angariador</Text>
            <Text style={styles.headerSubtitle}>Preencha os dados e documentos</Text>
          </View>
          {/* Step indicator */}
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>3 secções</Text>
          </View>
        </View>

        {/* ── Progress bar ── */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: loading ? '100%' : '60%' }]} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* 1 — Dados Pessoais */}
          <SectionCard icon="person-outline" iconBg={COLORS.primaryLight} iconColor={COLORS.primary} title="Dados Pessoais">
            <Controller control={control} name="nome" render={({ field: { onChange, value } }) => (
              <Input label="Nome Completo *" placeholder="Ex: João da Silva" value={value} onChangeText={onChange}
                error={errors.nome?.message}
                leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />} />
            )} />
            <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
              <Input label="Email *" placeholder="exemplo@email.com" keyboardType="email-address" autoCapitalize="none"
                value={value} onChangeText={onChange} error={errors.email?.message}
                leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />} />
            )} />
            <Controller control={control} name="msisdn" render={({ field: { onChange, value } }) => (
              <Input label="Contacto (MSISDN) *" placeholder="Ex: 840000000" keyboardType="phone-pad" maxLength={9}
                value={value} onChangeText={onChange} error={errors.msisdn?.message}
                leftIcon={<Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />} />
            )} />
          </SectionCard>

          {/* 2 — Identificação e Acesso */}
          <SectionCard icon="card-outline" iconBg={COLORS.secondaryLight} iconColor="#c49b00" title="Identificação e Acesso">
            <Controller control={control} name="bi" render={({ field: { onChange, value } }) => (
              <Input label="Nº do BI *" placeholder="Ex: 123456789012A" maxLength={13} autoCapitalize="characters"
                value={value} onChangeText={t => onChange(t.toUpperCase())} error={errors.bi?.message}
                leftIcon={<Ionicons name="id-card-outline" size={18} color={COLORS.textSecondary} />} />
            )} />
            <Controller control={control} name="nuit" render={({ field: { onChange, value } }) => (
              <Input label="NUIT (Opcional)" placeholder="Ex: 123456789" keyboardType="number-pad" maxLength={9}
                value={value} onChangeText={onChange} error={errors.nuit?.message}
                leftIcon={<Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />} />
            )} />
            <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
              <Input label="Palavra-passe *" placeholder="Mínimo 6 caracteres" secureTextEntry={!showPassword}
                value={value} onChangeText={onChange} error={errors.password?.message}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                } />
            )} />
          </SectionCard>

          {/* 3 — Documentos */}
          <SectionCard icon="images-outline" iconBg="#e3f2fd" iconColor="#1976d2" title="Documentos Anexos">
            <Text style={styles.sectionDescription}>
              Anexe imagens claras da frente e do verso do BI do angariador.
            </Text>
            <DocButton attached={!!biFrente} onPress={() => pickImage('bi_frente')}
              label="Anexar BI Frente *" error={errors.bi_frente?.message} />
            <DocButton attached={!!biVerso} onPress={() => pickImage('bi_verso')}
              label="Anexar BI Verso *" error={errors.bi_verso?.message} />
          </SectionCard>

          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit, onError)}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.submitBtn}
          >
            <LinearGradient
              colors={loading ? ['#aaa', '#aaa'] : [COLORS.primary, '#02a882']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitBtnInner}
            >
              {loading ? (
                <Text style={styles.submitBtnText}>A cadastrar...</Text>
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Salvar Angariador</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <LinearGradient colors={[COLORS.primary, '#02a882']} style={styles.modalIconRing}>
              <Ionicons name="checkmark" size={36} color="white" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Cadastrado!</Text>
            <Text style={styles.modalMessage}>Angariador registado com sucesso.</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setShowSuccessModal(false); navigation.goBack(); }}
            >
              <Text style={styles.modalBtnText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Error Modal ── */}
      <Modal visible={showErrorModal.visible} transparent animationType="fade"
        onRequestClose={() => setShowErrorModal({ visible: false, title: '', message: '' })}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconRing, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="alert-circle" size={36} color={COLORS.error} />
            </View>
            <Text style={[styles.modalTitle, { color: COLORS.error }]}>{showErrorModal.title}</Text>
            <Text style={styles.modalMessage}>{showErrorModal.message}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: COLORS.error }]}
              onPress={() => setShowErrorModal({ visible: false, title: '', message: '' })}
            >
              <Text style={styles.modalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  stepPill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepPillText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ── Progress ───────────────────────────────────────────
  progressBar: {
    height: 3,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // ── Scroll ─────────────────────────────────────────────
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  // ── Section card ───────────────────────────────────────
  card: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },

  // ── Doc buttons ────────────────────────────────────────
  docButtonContainer: { marginBottom: 10 },
  docButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  docButtonSuccess: {
    borderColor: 'transparent',
  },
  docButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 10,
  },
  docCameraCircle: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: -0.1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },

  // ── Footer ─────────────────────────────────────────────
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  },

  // ── Modals ─────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    width: '100%',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconRing: {
    width: 76,
    height: 76,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  modalBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.1,
  },
});