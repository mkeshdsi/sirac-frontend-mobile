import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, Linking, Modal, Dimensions, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, DocumentsPayload } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { LinearGradient } from 'expo-linear-gradient';

type Nav = StackNavigationProp<RootStackParamList, 'DocumentUpload'>;
type Route = RouteProp<RootStackParamList, 'DocumentUpload'>;
interface Props { navigation: Nav; route: Route }

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

const getFileExtension = (uri: string) => {
  const parts = uri.split('.');
  return parts[parts.length - 1]?.toLowerCase() || '';
};

const keyofDocumentsPayloadToLabel = (key: string) => {
  switch (key) {
    case 'biFrenteUri': return 'BI_Frente';
    case 'biVersoUri': return 'BI_Verso';
    case 'nuitUri': return 'NUIT';
    case 'alvaraUri': return 'Alvara';
    default: return 'Doc';
  }
};

// ── Animated upload card ─────────────────────────────────
const UploadCard = ({ item, isUploaded, uri, onAttach, onRemove, converting }: any) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[styles.uploadCard, isUploaded && styles.uploadCardCompleted, { transform: [{ scale }] }]}>
      {/* Card header */}
      <View style={styles.uploadCardHeader}>
        <View style={[styles.docIconWrap, isUploaded && styles.docIconWrapDone]}>
          {isUploaded
            ? <Ionicons name="checkmark" size={20} color="white" />
            : <Text style={styles.docEmoji}>{item.icon}</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.uploadCardTitle}>{item.title}</Text>
          {isUploaded && (
            <View style={styles.statusBadge}>
              <Ionicons name="document" size={10} color={COLORS.primary} style={{ marginRight: 3 }} />
              <Text style={styles.statusBadgeText}>PDF pronto</Text>
            </View>
          )}
        </View>
        {isUploaded && (
          <TouchableOpacity onPress={() => onRemove(item.key)} style={styles.removeBtn} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={15} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isUploaded && uri ? (
        <View style={styles.filePreview}>
          <View style={styles.filePreviewIcon}>
            <Ionicons name="document-text" size={28} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>{keyofDocumentsPayloadToLabel(item.key)}.pdf</Text>
            <Text style={styles.fileSize}>Documento convertido</Text>
          </View>
          <TouchableOpacity onPress={() => Print.printAsync({ uri })} style={styles.viewBtn} activeOpacity={0.85}>
            <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
            <Text style={styles.viewBtnText}>Ver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onAttach}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[styles.dropZone, converting && styles.dropZoneDisabled]}
          disabled={converting}
          activeOpacity={1}
        >
          {converting ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.dropZoneText}>A converter...</Text>
            </>
          ) : (
            <>
              <View style={styles.dropZoneIcon}>
                <Ionicons name={item.type === 'image' ? 'image-outline' : 'document-outline'} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.dropZoneText}>
                {item.type === 'image' ? 'Imagem ou câmera' : 'Ficheiro ou câmera'}
              </Text>
              <Text style={styles.dropZoneHint}>Toque para anexar</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export const DocumentUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { commercialData } = route.params;
  const [docs, setDocs] = useState<DocumentsPayload>({});
  const [converting, setConverting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<typeof documentItems[0] | null>(null);

  const documentItems = [
    { key: 'biFrenteUri' as keyof DocumentsPayload, title: 'BI / Passaporte (Frente)', icon: '🪪', type: 'image' },
    { key: 'biVersoUri' as keyof DocumentsPayload, title: 'Verso (se aplicável)', icon: '🪪', type: 'image' },
    { key: 'nuitUri' as keyof DocumentsPayload, title: 'NUIT (Documento)', icon: '🔢', type: 'file' },
    { key: 'alvaraUri' as keyof DocumentsPayload, title: 'Licença / Alvará', icon: '📜', type: 'file' },
  ];

  const hasAnyDoc = Object.values(docs).some(Boolean);
  const uploadedCount = Object.values(docs).filter(Boolean).length;
  const totalCount = documentItems.length;
  const progress = (uploadedCount / totalCount) * 100;

  const convertToPdf = async (imageUri: string, key: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const src = `data:image/jpeg;base64,${base64}`;
      const html = `<html><body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain;" /></body></html>`;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const docDir = (FileSystem as any).documentDirectory;
      if (docDir) {
        const dir = docDir + 'debug_docs/';
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
        const debugPath = dir + `debug_${key}_${Date.now()}.pdf`;
        await FileSystem.copyAsync({ from: uri, to: debugPath });
      }
      return uri;
    } catch (e) {
      Alert.alert('Erro', 'Falha na conversão do documento.');
      return imageUri;
    }
  };

  const processAndSetDoc = async (key: keyof DocumentsPayload, uri: string) => {
    setConverting(true);
    try {
      const ext = getFileExtension(uri);
      let finalUri = uri;
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
        finalUri = await convertToPdf(uri, key);
      }
      setDocs((d) => ({ ...d, [key]: finalUri }));
    } finally {
      setConverting(false);
    }
  };

  const pickImage = async (key: keyof DocumentsPayload) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: false });
    if (!res.canceled && res.assets?.[0]?.uri) await processAndSetDoc(key, res.assets[0].uri);
  };

  const pickFile = async (key: keyof DocumentsPayload) => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ['application/pdf', 'image/*'] });
    if (res.assets?.[0]?.uri) await processAndSetDoc(key, res.assets[0].uri);
  };

  const takePhoto = async (key: keyof DocumentsPayload) => {
    try {
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: false });
      if (!res.canceled && res.assets?.[0]?.uri) await processAndSetDoc(key, res.assets[0].uri);
    } catch { Alert.alert('Erro', 'Não foi possível abrir a câmera.'); }
  };

  const handleModalAction = async (action: 'camera' | 'gallery' | 'file') => {
    setModalVisible(false);
    if (!activeItem) return;
    setTimeout(async () => {
      if (action === 'camera') await takePhoto(activeItem.key);
      else if (action === 'gallery') await pickImage(activeItem.key);
      else await pickFile(activeItem.key);
    }, 400);
  };

  const handleAttachment = (item: typeof documentItems[0]) => {
    setActiveItem(item);
    setModalVisible(true);
  };

  const removeDoc = (key: keyof DocumentsPayload) => {
    setDocs((d) => { const n = { ...d }; delete n[key]; return n; });
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <LinearGradient colors={[COLORS.primary, '#02a882']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Anexar Documentos</Text>
        <Text style={styles.headerSubtitle}>Documentos de imagem são convertidos automaticamente para PDF</Text>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{uploadedCount} de {totalCount} anexados</Text>
            <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Upload cards ── */}
        <View style={styles.cardsGrid}>
          {documentItems.map((item) => (
            <UploadCard
              key={item.key}
              item={item}
              isUploaded={!!docs[item.key]}
              uri={docs[item.key]}
              onAttach={() => handleAttachment(item)}
              onRemove={removeDoc}
              converting={converting}
            />
          ))}
        </View>

        {/* ── Tips card ── */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipsIconWrap}>
              <Text style={{ fontSize: 16 }}>💡</Text>
            </View>
            <Text style={styles.tipsTitle}>Dicas importantes</Text>
          </View>
          <View style={styles.tipsList}>
            {[
              'Documentos de imagem serão convertidos automaticamente para PDF.',
              'Carregue o BI ou Passaporte primeiro.',
            ].map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Success banner ── */}
        {uploadedCount >= 3 && (
          <View style={styles.successBanner}>
            <LinearGradient colors={[COLORS.primary, '#02a882']} style={styles.successBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={28} color="white" />
              </View>
              <View>
                <Text style={styles.successTitle}>Documentos prontos!</Text>
                <Text style={styles.successSubtitle}>Pode prosseguir para a revisão final</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={converting} activeOpacity={0.8}>
          <Ionicons name="arrow-back-outline" size={18} color={COLORS.primary} />
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('ReviewSubmit', { commercialData, documents: docs })}
          disabled={!hasAnyDoc || converting}
          activeOpacity={0.85}
          style={styles.continueBtn}
        >
          <LinearGradient
            colors={(!hasAnyDoc || converting) ? ['#c0c0c0', '#c0c0c0'] : [COLORS.primary, '#02a882']}
            style={styles.continueBtnInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {!converting && hasAnyDoc && <Ionicons name="arrow-forward-circle-outline" size={19} color="white" style={{ marginRight: 7 }} />}
            <Text style={styles.continueBtnText}>
              {converting ? 'Aguarde...' : hasAnyDoc ? 'Continuar' : 'Anexe documentos'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Sheet Modal ── */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Anexar Documento</Text>
              <Text style={styles.sheetSubtitle}>{activeItem?.title}</Text>

              <View style={styles.sheetOptions}>
                <TouchableOpacity style={styles.sheetOption} onPress={() => handleModalAction('camera')} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.primary, '#02a882']} style={styles.sheetOptionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="camera" size={22} color="white" />
                  </LinearGradient>
                  <Text style={styles.sheetOptionLabel}>Câmera</Text>
                  <Text style={styles.sheetOptionHint}>Tirar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => handleModalAction(activeItem?.type === 'image' ? 'gallery' : 'file')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.sheetOptionIcon, styles.sheetOptionIconSecondary]}>
                    <Ionicons
                      name={activeItem?.type === 'image' ? 'images' : 'document-text'}
                      size={22}
                      color="#c49b00"
                    />
                  </View>
                  <Text style={styles.sheetOptionLabel}>
                    {activeItem?.type === 'image' ? 'Galeria' : 'Ficheiro'}
                  </Text>
                  <Text style={styles.sheetOptionHint}>
                    {activeItem?.type === 'image' ? 'Da galeria' : 'Do dispositivo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.sheetCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.sheetCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──────────────────────────────────────────────
  header: {
    paddingTop: 12, paddingBottom: 28, paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerDecor1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40 },
  headerDecor2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', bottom: 10, left: -10 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 20, lineHeight: 18 },

  progressWrap: { gap: 6 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: 'white', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  progressPct: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },

  // ── Scroll ─────────────────────────────────────────────
  scroll: { flex: 1, marginTop: -12 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },
  cardsGrid: { gap: 12 },

  // ── Upload card ────────────────────────────────────────
  uploadCard: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.border,
    shadowColor: '#1a1a2e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  uploadCardCompleted: { borderColor: COLORS.primary, backgroundColor: '#f0faf7' },
  uploadCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  docIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  docIconWrapDone: { backgroundColor: COLORS.primary },
  docEmoji: { fontSize: 22 },
  uploadCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, letterSpacing: -0.1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 3, backgroundColor: COLORS.primaryLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  removeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center' },

  // ── File preview ───────────────────────────────────────
  filePreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, padding: 12, gap: 10 },
  filePreviewIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  fileName: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  fileSize: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // ── Drop zone ──────────────────────────────────────────
  dropZone: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed',
    borderRadius: 13, paddingVertical: 22, alignItems: 'center', backgroundColor: COLORS.primaryLight,
  },
  dropZoneDisabled: { opacity: 0.5 },
  dropZoneIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  dropZoneText: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  dropZoneHint: { fontSize: 11, color: COLORS.textSecondary },

  // ── Tips card ──────────────────────────────────────────
  tipsCard: { backgroundColor: COLORS.secondaryLight, borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.secondary + '30' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  tipsIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  tipsList: { gap: 8 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 6 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 },

  // ── Success banner ─────────────────────────────────────
  successBanner: { marginTop: 14, borderRadius: 16, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  successBannerInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  successIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: -0.2 },
  successSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // ── Footer ─────────────────────────────────────────────
  footer: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.white },
  backBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  continueBtn: { flex: 1, borderRadius: 13, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  continueBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: 'white', letterSpacing: -0.1 },

  // ── Bottom sheet ───────────────────────────────────────
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4, textAlign: 'center', marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  sheetOptions: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  sheetOption: { flex: 1, backgroundColor: COLORS.background, borderRadius: 18, paddingVertical: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border },
  sheetOptionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  sheetOptionIconSecondary: { backgroundColor: COLORS.secondaryLight },
  sheetOptionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sheetOptionHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: -6 },
  sheetCancel: { paddingVertical: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },
  sheetCancelText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
});
