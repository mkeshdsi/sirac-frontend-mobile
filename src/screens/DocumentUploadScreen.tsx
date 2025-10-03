import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Linking, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, DocumentsPayload } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

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

const getFileExtension = (uri: string) => {
  const parts = uri.split('.');
  return parts[parts.length - 1]?.toLowerCase() || '';
};

const isImageFile = (uri: string) => {
  const ext = getFileExtension(uri);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

const getFileIcon = (uri: string) => {
  const ext = getFileExtension(uri);
  if (ext === 'pdf') return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  return '📎';
};

export const DocumentUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { commercialData } = route.params;
  const [docs, setDocs] = useState<DocumentsPayload>({});
  const hasAnyDoc = Object.values(docs).some(Boolean);

  const pickImage = async (key: keyof DocumentsPayload) => {
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets && res.assets[0]?.uri) {
      setDocs((d) => ({ ...d, [key]: res.assets![0]!.uri }));
    }
  };

  const pickFile = async (key: keyof DocumentsPayload) => {
    const res = await DocumentPicker.getDocumentAsync({ 
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/*'],
    });
    if (res.assets && res.assets[0]?.uri) {
      setDocs((d) => ({ ...d, [key]: res.assets![0]!.uri }));
    }
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

  const documentItems = [
    { key: 'biFrenteUri' as keyof DocumentsPayload, title: 'BI (Frente)', icon: '🪪', type: 'image' },
    { key: 'biVersoUri' as keyof DocumentsPayload, title: 'BI (Verso)', icon: '🪪', type: 'image' },
    { key: 'alvaraUri' as keyof DocumentsPayload, title: 'Alvará', icon: '📜', type: 'file' },
    { key: 'comprovativoResidenciaUri' as keyof DocumentsPayload, title: 'Comprovativo de Residência', icon: '🏠', type: 'file' },
    { key: 'fotoPerfilUri' as keyof DocumentsPayload, title: 'Foto de Perfil', icon: '📸', type: 'image' },
  ];

  const uploadedCount = Object.values(docs).filter(Boolean).length;
  const totalCount = documentItems.length;
  const progress = (uploadedCount / totalCount) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carregar Documentos</Text>
        <Text style={styles.headerSubtitle}>Anexe os documentos necessários para completar o cadastro</Text>
        
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
                      {isUploaded && <Text style={styles.uploadCardStatus}>✓ Anexado</Text>}
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
                    {isImageFile(uri) ? (
                      <Image 
                        source={{ uri }} 
                        style={styles.previewImage} 
                        resizeMode="cover" 
                      />
                    ) : (
                      <View style={styles.filePreview}>
                        <Text style={styles.fileIcon}>{getFileIcon(uri)}</Text>
                        <Text style={styles.fileName}>
                          {uri.split('/').pop()?.substring(0, 30) || 'Documento'}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => Linking.openURL(uri)}
                          style={styles.openFileButton}
                        >
                          <Text style={styles.openFileButtonText}>Abrir documento</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => item.type === 'image' ? pickImage(item.key) : pickFile(item.key)}
                    style={styles.uploadButton}
                  >
                    <Text style={styles.uploadButtonIcon}>
                      {item.type === 'image' ? '📷' : '📁'}
                    </Text>
                    <Text style={styles.uploadButtonText}>
                      {item.type === 'image' ? 'Escolher imagem' : 'Escolher ficheiro'}
                    </Text>
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
              <Text style={styles.infoText}>Certifique-se de que as imagens estão nítidas e legíveis</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Formato aceito: JPG, PNG, PDF</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Tamanho máximo: 10MB por ficheiro</Text>
            </View>
          </View>
        </Card>

        {/* Success Message */}
        {uploadedCount === totalCount && (
          <Card style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Todos os documentos anexados!</Text>
            <Text style={styles.successText}>Pode prosseguir para a revisão final</Text>
          </Card>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.footerButtonSecondary}
        >
          <Text style={styles.footerButtonSecondaryText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={goNext} 
          style={[
            styles.footerButtonPrimary,
            !hasAnyDoc ? styles.footerButtonDisabled : undefined
          ]}
          disabled={!hasAnyDoc}
        >
          <Text style={[
            styles.footerButtonPrimaryText,
            !hasAnyDoc ? styles.footerButtonDisabledText : undefined
          ]}>
            {hasAnyDoc ? 'Continuar' : 'Anexe pelo menos 1 documento'}
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
});