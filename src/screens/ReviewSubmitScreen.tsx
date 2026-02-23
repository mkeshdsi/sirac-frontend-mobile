import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';
import { Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { getAuthApi } from '@/config/api';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type Nav = StackNavigationProp<RootStackParamList, 'ReviewSubmit'>;
type Route = RouteProp<RootStackParamList, 'ReviewSubmit'>;

interface Props { navigation: Nav; route: Route }

const COLORS = {
  primary: '#01836b',
  secondary: '#ffcc03',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666666',
  error: '#d32f2f',
  border: '#e0e0e0',
  success: '#01836b',
};

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { commercialData, documents } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toISODate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const api = await getAuthApi();
      const formData = new FormData();

      if (commercialData) {
        formData.append("tipo_parceiro", commercialData.tipoParceiro || "");
        formData.append("designacao", commercialData.nomeComercial || "");
        formData.append("tipo_empresa", commercialData.tipoEmpresa || "");
        formData.append("natureza_actividade", commercialData.naturezaObjecto || "");

        if (commercialData.nuit) formData.append("nuit", commercialData.nuit);
        if (commercialData.contactoAgente) formData.append("contacto_agente", commercialData.contactoAgente);

        formData.append("bairro_ref", commercialData.enderecoBairroRef || "");
        formData.append("profissao", commercialData.profissao || "");
        formData.append("assinatura_adesao", commercialData.assinatura || "");
        formData.append("data_adesao", toISODate(commercialData.dataFormulario));
        formData.append("angariador_id", "40");

        formData.append("endereco", JSON.stringify({
          cidade: commercialData.enderecoCidade || "",
          localidade: commercialData.enderecoLocalidade || "",
          avenida_rua: commercialData.enderecoAvenidaRua || "",
          numero: commercialData.enderecoNumero || "",
          quarteirao: commercialData.enderecoQuart || "",
          telefone: commercialData.telefone || "",
          celular: commercialData.celular || "",
        }));

        if (commercialData.latitude !== null && commercialData.longitude !== null) {
          let base64Foto = "";
          if (commercialData.fotografia) {
            try {
              base64Foto = await FileSystem.readAsStringAsync(commercialData.fotografia, {
                encoding: 'base64',
              });
              if (!base64Foto.startsWith('data:')) {
                base64Foto = `data:image/jpeg;base64,${base64Foto}`;
              }
            } catch (err) {
              console.error("Error converting photo to Base64:", err);
            }
          }

          formData.append("banca", JSON.stringify([{
            latitude: commercialData.latitude,
            longitude: commercialData.longitude,
            fotografia: base64Foto,
          }]));
        }

        if ((commercialData.proprietarios?.length ?? 0) > 0) {
          formData.append("proprietarios", JSON.stringify(commercialData.proprietarios));
        }
        if ((commercialData.assistentes?.length ?? 0) > 0) {
          formData.append("assistentes", JSON.stringify(commercialData.assistentes));
        }
        if ((commercialData.estabelecimentos?.length ?? 0) > 0) {
          formData.append("estabelecimentos", JSON.stringify(commercialData.estabelecimentos));
        }
      }

      if (documents.biFrenteUri) {
        (formData as any).append("bi", { uri: documents.biFrenteUri, name: "bi_frente.pdf", type: "application/pdf" });
      }
      if (documents.biVersoUri) {
        (formData as any).append("bi", { uri: documents.biVersoUri, name: "bi_verso.pdf", type: "application/pdf" });
      }
      if (documents.alvaraUri) {
        (formData as any).append("alvara", { uri: documents.alvaraUri, name: "alvara.pdf", type: "application/pdf" });
      }
      if (documents.nuitUri) {
        (formData as any).append("nuit", { uri: documents.nuitUri, name: "nuit.pdf", type: "application/pdf" });
      }

      const response = await api.post("/api/v1/parceiros/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        navigation.replace("Success", { registrationId: response.data?.id || "123" });
      } else {
        throw new Error("Falha ao criar parceiro");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      const backendMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Erro ao submeter formulário";
      setError(backendMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const ReviewItem = ({ label, value, icon }: { label: string; value?: string | number; icon: string }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewItemLeft}>
        <View style={styles.reviewIconContainer}>
          <Ionicons name={icon as any} size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.reviewLabel}>{label}</Text>
      </View>
      <Text style={styles.reviewValue} numberOfLines={1} ellipsizeMode="tail">{value || '---'}</Text>
    </View>
  );

  const DocItem = ({ label, exists }: { label: string; exists: boolean }) => (
    <View style={styles.docItem}>
      <Ionicons
        name={exists ? "checkmark-circle" : "close-circle"}
        size={20}
        color={exists ? COLORS.success : COLORS.error}
      />
      <Text style={[styles.docLabel, !exists && { color: COLORS.error }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revisão Final</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileInitial}>
              {commercialData?.nomeComercial?.charAt(0).toUpperCase() || 'P'}
            </Text>
          </View>
          <Text style={styles.welcomeTitle}>{commercialData?.nomeComercial || 'Novo Parceiro'}</Text>
          <Text style={styles.welcomeSubtitle}>Confirme os dados antes de submeter</Text>
        </View>

        {/* Commercial Data Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Dados Comerciais</Text>
          </View>
          <View style={styles.cardBody}>
            <ReviewItem label="Tipo" value={commercialData?.tipoParceiro} icon="people" />
            <ReviewItem label="NUIT" value={commercialData?.nuit} icon="card" />
            <ReviewItem label="Alvará" value={commercialData?.alvara} icon="document-text" />
            <ReviewItem label="Atividade" value={commercialData?.naturezaObjecto} icon="briefcase" />
          </View>
        </Card>



        {/* Documents Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="attach" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Documentos Anexados</Text>
          </View>
          <View style={styles.docGrid}>
            <DocItem label="BI Frente" exists={!!documents.biFrenteUri} />
            <DocItem label="BI Verso" exists={!!documents.biVersoUri} />
            <DocItem label="NUIT" exists={!!documents.nuitUri} />
            <DocItem label="Alvará" exists={!!documents.alvaraUri} />
          </View>
        </Card>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={COLORS.surface} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.btnSecondaryText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, submitting && styles.btnDisabled]}
          onPress={submit}
          disabled={submitting || !commercialData}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <>
              <Text style={styles.btnPrimaryText}>Submeter Formulário</Text>
              <Ionicons name="cloud-upload" size={20} color={COLORS.surface} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  welcomeSection: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  profileBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileInitial: { fontSize: 32, fontWeight: '800', color: COLORS.surface },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  welcomeSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  card: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#01836b08',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginLeft: 8 },
  cardBody: { padding: 8 },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  reviewItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  reviewIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#01836b10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  reviewValue: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  docGrid: { padding: 16, gap: 12 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docLabel: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  errorBanner: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorBannerText: { color: COLORS.surface, fontSize: 14, fontWeight: '600', marginLeft: 10, flex: 1 },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  btnPrimary: {
    flex: 2,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  btnPrimaryText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
