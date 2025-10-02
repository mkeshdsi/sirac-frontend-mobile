import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Linking } from 'react-native';
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

export const DocumentUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { commercialData } = route.params;
  const [docs, setDocs] = useState<DocumentsPayload>({});
  const hasAnyDoc = Object.values(docs).some(Boolean);

  const pickImage = async (key: keyof DocumentsPayload) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets && res.assets[0]?.uri) {
      setDocs((d) => ({ ...d, [key]: res.assets![0]!.uri }));
    }
  };

  const pickFile = async (key: keyof DocumentsPayload) => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.assets && res.assets[0]?.uri) {
      setDocs((d) => ({ ...d, [key]: res.assets![0]!.uri }));
    }
  };

  const goNext = () => {
    navigation.navigate('ReviewSubmit', { commercialData, documents: docs });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carregar Documentos</Text>
        <Text style={styles.subtitle}>Anexe as imagens/ficheiros necessários</Text>
      </View>

      <View style={styles.grid}>
        <Card style={styles.item}><Text style={styles.itemTitle}>BI (Frente)</Text><Button title="Escolher imagem" variant="outline" onPress={() => pickImage('biFrenteUri')} /></Card>
        <Card style={styles.item}><Text style={styles.itemTitle}>BI (Verso)</Text><Button title="Escolher imagem" variant="outline" onPress={() => pickImage('biVersoUri')} /></Card>
        <Card style={styles.item}><Text style={styles.itemTitle}>Alvará</Text><Button title="Escolher ficheiro" variant="outline" onPress={() => pickFile('alvaraUri')} /></Card>
        <Card style={styles.item}><Text style={styles.itemTitle}>Comprov. Residência</Text><Button title="Escolher ficheiro" variant="outline" onPress={() => pickFile('comprovativoResidenciaUri')} /></Card>
        <Card style={styles.item}><Text style={styles.itemTitle}>Foto de Perfil</Text><Button title="Escolher imagem" variant="outline" onPress={() => pickImage('fotoPerfilUri')} /></Card>
      </View>

      {/* Pré-visualização dos documentos anexados */}
      {hasAnyDoc && (
        <View style={{ marginTop: Theme.spacing.lg }}>
          <Text style={styles.previewTitle}>Pré-visualização</Text>
          <View style={styles.previewGrid}>
            {docs.biFrenteUri ? (
              <Card style={styles.previewItem}>
                <Text style={styles.previewLabel}>BI (Frente)</Text>
                <Image source={{ uri: docs.biFrenteUri }} style={styles.previewImage} resizeMode="cover" />
              </Card>
            ) : null}
            {docs.biVersoUri ? (
              <Card style={styles.previewItem}>
                <Text style={styles.previewLabel}>BI (Verso)</Text>
                <Image source={{ uri: docs.biVersoUri }} style={styles.previewImage} resizeMode="cover" />
              </Card>
            ) : null}
            {docs.fotoPerfilUri ? (
              <Card style={styles.previewItem}>
                <Text style={styles.previewLabel}>Foto de Perfil</Text>
                <Image source={{ uri: docs.fotoPerfilUri }} style={styles.previewImage} resizeMode="cover" />
              </Card>
            ) : null}
            {docs.alvaraUri ? (
              <Card style={styles.previewItem}>
                <Text style={styles.previewLabel}>Alvará</Text>
                <Button title="Abrir" variant="outline" onPress={() => Linking.openURL(docs.alvaraUri!)} />
              </Card>
            ) : null}
            {docs.comprovativoResidenciaUri ? (
              <Card style={styles.previewItem}>
                <Text style={styles.previewLabel}>Comprov. Residência</Text>
                <Button title="Abrir" variant="outline" onPress={() => Linking.openURL(docs.comprovativoResidenciaUri!)} />
              </Card>
            ) : null}
          </View>
        </View>
      )}

      {/* Botão adicional que aparece após anexar pelo menos um documento */}
      <View style={{ marginTop: Theme.spacing.lg }}>
        <Button title="Prosseguir para Revisão" onPress={goNext} disabled={!hasAnyDoc} />
        {!hasAnyDoc && (
          <Text style={{ ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 6 }}>
            Anexe pelo menos um documento para prosseguir.
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
        <Button title="Continuar" onPress={goNext} style={{ flex: 2 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  header: { marginBottom: Theme.spacing.lg },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body2, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  grid: { gap: Theme.spacing.md },
  item: {},
  itemTitle: { ...Theme.typography.h4, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.sm },
  previewTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.sm },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.md },
  previewItem: { width: '48%' },
  previewLabel: { ...Theme.typography.body2, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.xs },
  previewImage: { width: '100%', height: 140, borderRadius: Theme.borderRadius.md, backgroundColor: '#eee' },
  footer: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.lg },
});
