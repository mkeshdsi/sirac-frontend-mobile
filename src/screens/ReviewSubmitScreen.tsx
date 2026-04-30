import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { getAuthApi } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';

type Nav = StackNavigationProp<RootStackParamList, 'ReviewSubmit'>;
type Route = RouteProp<RootStackParamList, 'ReviewSubmit'>;

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
  success: '#2e7d32',
};

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { commercialData, documents } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const toISODate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY -> YYYY-MM-DD
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
        if (commercialData.banco) formData.append("banco", commercialData.banco);
        if (commercialData.numeroConta) formData.append("numero_conta", commercialData.numeroConta);
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
              console.error("Erro ao converter foto da banca para Base64:", err);
            }
          }

          formData.append("banca", JSON.stringify([{
            latitude: commercialData.latitude,
            longitude: commercialData.longitude,
            fotografia: base64Foto,
          }]));
        }

        if (commercialData.proprietarios && commercialData.proprietarios.length > 0) {
          formData.append("proprietarios", JSON.stringify(commercialData.proprietarios));
        }

        if (commercialData.assistentes && commercialData.assistentes.length > 0) {
          const assistentesPayload = commercialData.assistentes.map((a: any) => ({
            nome_completo: a.nomeCompleto,
            contacto: a.contacto,
          }));
          formData.append("assistentes", JSON.stringify(assistentesPayload));
        }

        if (commercialData.estabelecimentos && commercialData.estabelecimentos.length > 0) {
          const estabelecimentosPayload = commercialData.estabelecimentos.map((e: any) => ({
            nome: e.nome,
            provincia_localidade: e.provinciaLocalidade,
            endereco_bairro: e.enderecoBairro,
          }));
          formData.append("estabelecimentos", JSON.stringify(estabelecimentosPayload));
        }
      }

      if (documents.biFrenteUri) {
        formData.append("bi", { uri: documents.biFrenteUri, name: "bi_frente.pdf", type: "application/pdf" } as any);
      }
      if (documents.biVersoUri) {
        formData.append("bi", { uri: documents.biVersoUri, name: "bi_verso.pdf", type: "application/pdf" } as any);
      }
      if (documents.alvaraUri) {
        formData.append("alvara", { uri: documents.alvaraUri, name: "alvara.pdf", type: "application/pdf" } as any);
      }
      if (documents.nuitUri) {
        formData.append("nuit", { uri: documents.nuitUri, name: "nuit.pdf", type: "application/pdf" } as any);
      }

      const response = await api.post("/api/v1/parceiros/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });

      if (response.status === 201 || response.status === 200) {
        navigation.replace("Success", { registrationId: response.data?.id || "123" });
      } else {
        throw new Error(`Falha ao criar parceiro (Status: ${response.status})`);
      }
    } catch (err: any) {
      console.error("Erro submit detalhado:", err);
      let backendMsg = "Erro de conexão (Network Error)";
      
      if (err.response) {
        // O servidor respondeu com um código fora de 2xx
        const status = err.response.status;
        const data = err.response.data;
        backendMsg = `Erro ${status}: ${data?.error || data?.message || JSON.stringify(data) || "Erro no servidor"}`;
      } else if (err.request) {
        // A requisição foi feita mas não houve resposta (Timeout ou Network Error)
        backendMsg = "O servidor não respondeu. Verifique sua internet ou se o arquivo é muito grande.";
      } else {
        backendMsg = err.message || "Erro desconhecido";
      }

      setError(backendMsg);
      Alert.alert("Erro na Submissão", backendMsg);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const InfoRow = ({ label, value, icon }: { label: string; value?: string; icon?: string }) => {
    if (!value || value.trim() === "") return null;
    
    return (
      <View style={styles.infoRow}>
        <View style={styles.infoLabelContainer}>
          {icon && <Ionicons name={icon as any} size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />}
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revisão Final</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="document-text" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>{commercialData?.nomeComercial || "Novo Parceiro"}</Text>
            <Text style={styles.summarySubtitle}>{commercialData?.tipoParceiro} • {commercialData?.dataFormulario}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: COLORS.primaryLight }]}>
            <Text style={[styles.statusText, { color: COLORS.primary }]}>PRONTO</Text>
          </View>
        </View>

        {commercialData && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="business" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Dados Comerciais</Text>
            </View>
            <InfoRow label="Nome Comercial" value={commercialData.nomeComercial} icon="pricetag-outline" />
            <InfoRow label="NUIT" value={commercialData.nuit} icon="id-card-outline" />
            <InfoRow label="Alvará/Licença" value={commercialData.alvara} icon="ribbon-outline" />
            <InfoRow label="Tipo Empresa" value={commercialData.tipoEmpresa} icon="layers-outline" />
            <InfoRow label="Banco" value={commercialData.banco} icon="wallet-outline" />
            <InfoRow label="Nº de Conta" value={commercialData.numeroConta} icon="cash-outline" />
          </Card>
        )}

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Localização e Contacto</Text>
          </View>
          <InfoRow label="Cidade" value={commercialData?.enderecoCidade} icon="map-outline" />
          <InfoRow label="Telefone" value={commercialData?.telefone} icon="call-outline" />
          <InfoRow label="Celular" value={commercialData?.celular} icon="smartphone-outline" />
          <InfoRow label="Coordenadas" value={commercialData?.latitude ? `${commercialData.latitude.toFixed(4)}, ${commercialData.longitude?.toFixed(4)}` : undefined} icon="pin-outline" />
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud-upload" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Documentos Anexados</Text>
          </View>
          <View style={styles.docGrid}>
            <View style={styles.docStatus}>
              <Ionicons name={documents.biFrenteUri ? "checkmark-circle" : "close-circle"} size={18} color={documents.biFrenteUri ? COLORS.success : COLORS.error} />
              <Text style={styles.docStatusText}>BI Frente</Text>
            </View>
            <View style={styles.docStatus}>
              <Ionicons name={documents.biVersoUri ? "checkmark-circle" : "close-circle"} size={18} color={documents.biVersoUri ? COLORS.success : COLORS.error} />
              <Text style={styles.docStatusText}>BI Verso</Text>
            </View>
            <View style={styles.docStatus}>
              <Ionicons name={documents.nuitUri ? "checkmark-circle" : "close-circle"} size={18} color={documents.nuitUri ? COLORS.success : COLORS.error} />
              <Text style={styles.docStatusText}>NUIT</Text>
            </View>
            <View style={styles.docStatus}>
              <Ionicons name={documents.alvaraUri ? "checkmark-circle" : "close-circle"} size={18} color={documents.alvaraUri ? COLORS.success : COLORS.error} />
              <Text style={styles.docStatusText}>Alvará</Text>
            </View>
          </View>
        </Card>

        {error && (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={20} color={COLORS.white} />
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnSecondary}
          disabled={submitting}
        >
          <Text style={styles.btnSecondaryText}>Rever Dados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={submit}
          style={[styles.btnPrimary, submitting && styles.btnDisabled]}
          disabled={submitting}
        >
          {submitting ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.white} size="small" />
              {uploadProgress > 0 && (
                <Text style={{ color: COLORS.white, fontSize: 10, marginTop: 2 }}>{uploadProgress}%</Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.btnPrimaryText}>Submeter Adesão</Text>
              <Ionicons name="send" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryTextContainer: { flex: 1 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  summarySubtitle: { fontSize: 13, color: COLORS.textSecondary },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1.5, textAlign: 'right' },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  docStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: '45%',
    gap: 8,
  },
  docStatusText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  errorAlertText: { color: COLORS.white, fontSize: 14, fontWeight: '600', flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  btnPrimary: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
});
