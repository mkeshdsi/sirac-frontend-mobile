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
  warning: '#F59E0B',
  warningLight: '#F59E0B20',
};

const getFileExtension = (uri: string) => {
  const parts = uri.split('.');
  return parts[parts.length - 1]?.toLowerCase() || '';
};

const FILE_SIZE_LIMITS_MB = {
  biFrenteUri: 3,
  biVersoUri: 3,
  nuitUri: 3,
  alvaraUri: 3,
};

const validateFileSize = async (uri: string, key: keyof DocumentsPayload): Promise<{ valid: boolean; error?: string }> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || !fileInfo.size) return { valid: false };
    
    const limitMB = FILE_SIZE_LIMITS_MB[key] || 10;
    const limitBytes = limitMB * 1024 * 1024;
    const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
    
    if (fileInfo.size > limitBytes) {
      return { valid: false, error: `O ficheiro tem ${sizeMB}MB e excede o limite de ${limitMB}MB. Por favor, selecione um ficheiro menor.` };
    }
    return { valid: true };
  } catch (error) {
    console.error('Error validating file size:', error);
    return { valid: false };
  }
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
  const { commercialData, editParceiroId } = route.params;
  const [docs, setDocs] = useState<DocumentsPayload>({});
  const [converting, setConverting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<typeof documentItems[0] | null>(null);
  const [showErrorModal, setShowErrorModal] = useState('');

  const documentItems = [
    { key: 'biFrenteUri' as keyof DocumentsPayload, title: 'BI / Passaporte (Frente)', icon: '🪪', type: 'image' },
    { key: 'biVersoUri' as keyof DocumentsPayload, title: 'Verso (se aplicável)', icon: '🪪', type: 'image' },
    { key: 'nuitUri' as keyof DocumentsPayload, title: 'NUIT (Documento)', icon: '🔢', type: 'file' },
    { key: 'alvaraUri' as keyof DocumentsPayload, title: 'Licença / Alvará', icon: '📜', type: 'file' },
  ];

  const hasAnyDoc = Object.values(docs).some(Boolean) || !!editParceiroId;
  const uploadedCount = Object.values(docs).filter(Boolean).length;
  const totalCount = documentItems.length;
  const progress = (uploadedCount / totalCount) * 100;

  const convertToPdf = async (imageUri: string, key: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const src = `data:image/jpeg;base64,${base64}`;
      const html = `<html><body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain;" /></body></html>`;
      return imageUri;
    } catch (error) {
      console.error('Error converting to PDF:', error);
      return imageUri;
    }
  };

  const processAndSetDoc = async (key: keyof DocumentsPayload, uri: string) => {
    setConverting(true);
    try {
      const result = await validateFileSize(uri, key);
      if (!result.valid) {
        if (result.error) {
          setShowErrorModal(result.error);
        }
        return;
      }
      
      const finalUri = uri; // No conversion, keep original file URI.
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
          <Text style={styles.headerSubtitle}>Documentos de imagem são enviados como arquivos; o processamento será feito automaticamente.</Text>

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

          {/* ── Edit mode banner ── */}
          {!!editParceiroId && (
            <View style={styles.editBanner}>
              <LinearGradient colors={[COLORS.warning, '#D97706']} style={styles.editBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.editBannerIconWrap}>
                  <Ionicons name="alert-circle" size={28} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editBannerTitle}>Documentos já submetidos</Text>
                  <Text style={styles.editBannerSubtitle}>
                    Os documentos foram enviados anteriormente. Pode reenviar se pretender substituí-los, ou avançar sem alterações.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

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
                'Documentos de imagem são enviados como arquivos; o processamento será feito automaticamente.',
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
            onPress={() => navigation.navigate('ReviewSubmit', { commercialData, documents: docs, editParceiroId })}
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

        {/* ── Error Modal ── */}
        <Modal visible={!!showErrorModal} transparent animationType="fade" onRequestClose={() => setShowErrorModal('')}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, styles.centeredModalCard]}>
              <View style={[styles.modalIconRing, { backgroundColor: '#ffebee' }]}>
                <Ionicons name="alert-circle" size={36} color={COLORS.error} />
              </View>
              <Text style={[styles.modalTitle, { color: COLORS.error, textAlign: 'center' }]}>Erro</Text>
              <Text style={styles.modalMsg}>{showErrorModal}</Text>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.error }]} onPress={() => setShowErrorModal('')}>
                <Text style={styles.modalBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
    lineHeight: 18,
  },
  progressWrap: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  progressPct: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  cardsGrid: {
    gap: 12,
  },
  uploadCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uploadCardCompleted: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIconWrapDone: {
    backgroundColor: COLORS.primary,
  },
  docEmoji: {
    fontSize: 20,
  },
  uploadCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
  },
  filePreviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  fileSize: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dropZone: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  dropZoneDisabled: {
    opacity: 0.5,
  },
  dropZoneIcon: {
    marginBottom: 8,
  },
  dropZoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  dropZoneHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  successBanner: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  successBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  successIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  successSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  continueBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  sheetOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sheetOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  sheetOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionIconSecondary: {
    backgroundColor: COLORS.secondaryLight,
  },
  sheetOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetOptionHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sheetCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  centeredModalCard: {
    alignItems: 'center',
  },
  modalIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },

  // ── Edit mode banner ─────────────────────────────────────
  editBanner: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  editBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  editBannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  editBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
  },
});
