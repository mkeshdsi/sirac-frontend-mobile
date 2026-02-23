import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, Linking, Modal, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, DocumentsPayload } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

type Nav = StackNavigationProp<RootStackParamList, 'DocumentUpload'>;
type Route = RouteProp<RootStackParamList, 'DocumentUpload'>;

interface Props { navigation: Nav; route: Route }

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

import * as Print from 'expo-print';

// ... (imports existentes: React, View, etc... mas adicione Print acima)
// (Mantenha interfaces Props, COLORS, etc. inalterados até DocumentUploadScreen)

const getFileExtension = (uri: string) => {
  const parts = uri.split('.');
  return parts[parts.length - 1]?.toLowerCase() || '';
};


// Modifique DocumentUploadScreen para incluir lógica de conversão base64 e debug
export const DocumentUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { commercialData } = route.params;
  const [docs, setDocs] = useState<DocumentsPayload>({});
  const [converting, setConverting] = useState(false);

  const hasAnyDoc = Object.values(docs).some(Boolean);

  const documentItems = [
    { key: 'biFrenteUri' as keyof DocumentsPayload, title: 'BI / Passaporte (Identificação)', icon: '🪪', type: 'image' },
    // BI Verso opcional dependendo do documento, mas mantendo conforme solicitado "BI/passaporte..."
    { key: 'biVersoUri' as keyof DocumentsPayload, title: 'Verso (se aplicável)', icon: '🪪', type: 'image' },
    { key: 'nuitUri' as keyof DocumentsPayload, title: 'NUIT (Documento)', icon: '🔢', type: 'file' },
    { key: 'alvaraUri' as keyof DocumentsPayload, title: 'Licença / Alvará', icon: '📜', type: 'file' },
  ];

  const [modalVisible, setModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<typeof documentItems[0] | null>(null);

  const convertToPdf = async (imageUri: string, key: string): Promise<string> => {
    try {
      // Ler imagem em Base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const src = `data:image/jpeg;base64,${base64}`;

      const html = `
        <html>
          <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100%;">
            <img src="${src}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // DEBUG path
      const docDir = (FileSystem as any).documentDirectory;
      if (docDir) {
        const dir = docDir + 'debug_docs/';
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => { });
        const debugPath = dir + `debug_${key}_${Date.now()}.pdf`;
        await FileSystem.copyAsync({ from: uri, to: debugPath });
        console.log(`PDF GERADO (Debug): ${debugPath}`);
      }

      return uri;
    } catch (e) {
      console.error('Erro ao converter para PDF:', e);
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
        // Converter para PDF usando Base64
        finalUri = await convertToPdf(uri, key);
      }

      setDocs((d) => ({ ...d, [key]: finalUri }));
    } finally {
      setConverting(false);
    }
  };

  const pickImage = async (key: keyof DocumentsPayload) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true, // Permite cortar
      aspect: [3, 4],
    });
    if (!res.canceled && res.assets && res.assets[0]?.uri) {
      await processAndSetDoc(key, res.assets[0].uri);
    }
  };

  const pickFile = async (key: keyof DocumentsPayload) => {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/*'],
    });
    if (res.assets && res.assets[0]?.uri) {
      await processAndSetDoc(key, res.assets[0].uri);
    }
  };

  const takePhoto = async (key: keyof DocumentsPayload) => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        await processAndSetDoc(key, res.assets[0].uri);
      }
    } catch (e) {
      console.error('Erro camara:', e);
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  };

  const handleModalAction = async (action: 'camera' | 'gallery' | 'file') => {
    setModalVisible(false);
    if (!activeItem) return;

    // Small delay to allow modal to close smoothly
    setTimeout(async () => {
      if (action === 'camera') {
        await takePhoto(activeItem.key);
      } else if (action === 'gallery') {
        await pickImage(activeItem.key);
      } else if (action === 'file') {
        await pickFile(activeItem.key);
      }
    }, 400);
  };

  const handleAttachment = (item: typeof documentItems[0]) => {
    setActiveItem(item);
    setModalVisible(true);
  };

  const removeDoc = (key: keyof DocumentsPayload) => {
    setDocs((d) => {
      const newDocs = { ...d };
      delete newDocs[key];
      return newDocs;
    });
  };

  const goNext = () => {
    navigation.navigate('ReviewSubmit', { commercialData, documents: docs });
  };



  const uploadedCount = Object.values(docs).filter(Boolean).length;
  // totalCount baseia-se nos itens obrigatórios? Vamos considerar todos itens listados como meta visual.
  const totalCount = documentItems.length;
  const progress = (uploadedCount / totalCount) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carregar Documentos</Text>
        <Text style={styles.headerSubtitle}>Anexe os documentos (convertidos auto. para PDF)</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{uploadedCount} de {totalCount} documentos</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Upload Cards */}
        <View style={styles.uploadSection}>
          {documentItems.map((item) => {
            const isUploaded = !!docs[item.key];
            const uri = docs[item.key];

            return (
              <Card key={item.key} style={[styles.uploadCard, isUploaded ? styles.uploadCardCompleted : undefined]}>
                <View style={styles.uploadCardHeader}>
                  <View style={styles.uploadCardTitleRow}>
                    <View style={[styles.iconContainer, isUploaded ? styles.iconContainerCompleted : undefined]}>
                      <Text style={styles.iconText}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadCardTitle}>{item.title}</Text>
                      {isUploaded && <Text style={styles.uploadCardStatus}>✓ Pronto (PDF)</Text>}
                    </View>
                    {isUploaded && (
                      <TouchableOpacity
                        onPress={() => removeDoc(item.key)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {isUploaded && uri ? (
                  <View style={styles.previewContainer}>
                    <View style={styles.filePreview}>
                      <Text style={styles.fileIcon}>📄</Text>
                      <Text style={styles.fileName}>
                        {keyofDocumentsPayloadToLabel(item.key)}.pdf
                      </Text>
                      <TouchableOpacity
                        onPress={() => Print.printAsync({ uri })}
                        style={styles.openFileButton}
                      >
                        <View style={styles.inlineRow}>
                          <Ionicons name="open-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                          <Text style={styles.openFileButtonText}>Visualizar PDF</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleAttachment(item)}
                    style={[styles.uploadButton, converting && styles.uploadButtonDisabled]}
                    disabled={converting}
                  >
                    {converting ? (
                      <Text style={styles.uploadButtonText}>Processando...</Text>
                    ) : (
                      <>
                        <Ionicons
                          name={item.type === 'image' ? 'image-outline' : 'document-outline'}
                          size={28}
                          color={COLORS.primary}
                          style={{ marginBottom: 8 }}
                        />
                        <Text style={styles.uploadButtonText}>
                          {item.type === 'image' ? 'Escolher imagem' : 'Escolher ficheiro'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </Card>
            );
          })}
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>💡</Text>
            </View>
            <Text style={styles.infoTitle}>Dicas importantes</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Documentos de imagem serão convertidos automaticamente para PDF.</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Carregue o BI ou Passaporte primeiro.</Text>
            </View>
          </View>
        </Card>

        {/* Success Message */}
        {uploadedCount >= 3 && ( // Assumindo pelo menos 3 docs principais
          <Card style={styles.successCard}>
            <Text style={styles.successTitle}>Documentos prontos!</Text>
            <Text style={styles.successText}>Pode prosseguir para a revisão final</Text>
          </Card>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.footerButtonSecondary}
          disabled={converting}
        >
          <View style={styles.inlineRowCenter}>
            <Ionicons name="arrow-back-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.footerButtonSecondaryText}>Voltar</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goNext}
          style={[
            styles.footerButtonPrimary,
            (!hasAnyDoc || converting) ? styles.footerButtonDisabled : undefined
          ]}
          disabled={!hasAnyDoc || converting}
        >
          <View style={styles.inlineRowCenter}>
            <Text style={[
              styles.footerButtonPrimaryText,
              (!hasAnyDoc || converting) ? styles.footerButtonDisabledText : undefined
            ]}>
              {converting ? 'Aguarde...' : (hasAnyDoc ? 'Continuar' : 'Anexe documentos')}
            </Text>
            {hasAnyDoc && !converting && (
              <Ionicons name="arrow-forward-outline" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
            )}
          </View>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1}>
              {/* Prevent closing when clicking content */}
              <View style={styles.modalHeader}>
                <View style={styles.modalDragIndicator} />
                <Text style={styles.modalTitle}>Anexar Documento</Text>
              </View>

              <View style={styles.modalGrid}>
                {/* Card Camera */}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleModalAction('camera')}
                >
                  <View style={styles.modalOptionContent}>
                    <View style={[styles.modalOptionIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                      <Ionicons name="camera" size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.modalOptionText}>Tirar Foto</Text>
                  </View>
                </TouchableOpacity>

                {/* Card Gallery/File */}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleModalAction(activeItem?.type === 'image' ? 'gallery' : 'file')}
                >
                  <View style={styles.modalOptionContent}>
                    <View style={[styles.modalOptionIconContainer, { backgroundColor: COLORS.secondaryLight }]}>
                      <Ionicons
                        name={activeItem?.type === 'image' ? "images" : "document-text"}
                        size={24}
                        color={'#d4a000'} // Darker yellow
                      />
                    </View>
                    <Text style={styles.modalOptionText}>
                      {activeItem?.type === 'image' ? 'Galeria' : 'Ficheiro'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const keyofDocumentsPayloadToLabel = (key: string) => {
  switch (key) {
    case 'biFrenteUri': return 'BI_Frente';
    case 'biVersoUri': return 'BI_Verso';
    case 'nuitUri': return 'NUIT';
    case 'alvaraUri': return 'Alvara';
    default: return 'Doc';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
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
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'right',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  uploadSection: {
    gap: 16,
  },
  uploadCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadCardCompleted: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  uploadCardHeader: {
    marginBottom: 12,
  },
  uploadCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerCompleted: {
    backgroundColor: COLORS.primary,
  },
  iconText: {
    fontSize: 24,
  },
  uploadCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  uploadCardStatus: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '700',
  },
  previewContainer: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  filePreview: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  openFileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  openFileButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
    fontWeight: '700',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
  footerButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  footerButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  footerButtonDisabledText: {
    color: COLORS.textSecondary,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  modalOption: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOptionContent: {
    alignItems: 'center',
    gap: 8,
  },
  modalOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});