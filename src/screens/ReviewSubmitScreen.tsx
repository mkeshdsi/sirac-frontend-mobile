import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { getAuthApi } from '@/config/api';
import * as FileSystem from 'expo-file-system/legacy';
import {
  MaterialIcons,
  FontAwesome,
  Ionicons
} from '@expo/vector-icons';

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
  success: '#01836b',
};

const ReviewCard = ({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode
}) => (
  <Card style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIcon}>
        {icon}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>
      {children}
    </View>
  </Card>
);

const ReviewItem = ({
  label,
  value,
  required = false
}: {
  label: string;
  value: string;
  required?: boolean
}) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewItemLabelContainer}>
      <Text style={styles.reviewItemLabel}>{label}</Text>
      {required && value === '-' && (
        <Text style={styles.requiredBadge}>Obrigatório</Text>
      )}
    </View>
    <Text style={[
      styles.reviewItemValue,
      value === '-' && styles.reviewItemValueEmpty,
      required && value === '-' && styles.reviewItemValueRequired
    ]}>
      {value}
    </Text>
  </View>
);

const DocumentStatus = ({
  type,
  uploaded
}: {
  type: string;
  uploaded: boolean
}) => (
  <View style={styles.documentItem}>
    <View style={styles.documentIconContainer}>
      {uploaded ? (
        <MaterialIcons name="check-circle" size={24} color={Theme.colors.success} />
      ) : (
        <MaterialIcons name="error" size={24} color={Theme.colors.warning} />
      )}
    </View>
    <View style={styles.documentInfo}>
      <Text style={styles.documentName}>{type}</Text>
      <Text style={[
        styles.documentStatus,
        uploaded ? styles.documentStatusSuccess : styles.documentStatusWarning
      ]}>
        {uploaded ? '✓ Carregado' : '✗ Pendente'}
      </Text>
    </View>
  </View>
);

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
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

  const calculateCompletion = () => {
    if (!commercialData) return 0;

    const requiredFields = [
      'tipoParceiro',
      'nomeComercial',
      'nuit',
      'alvara',
      'bancaEnderecoCidade',
      'assinatura',
      'dataFormulario'
    ];

    const filledFields = requiredFields.filter(field => {
      const value = commercialData[field as keyof typeof commercialData];
      return value !== undefined && value !== null && value !== '';
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const hasAllRequiredFields = () => {
    // Relaxed validation to ensure the button is enabled as requested
    // but still checking for the absolute basics to avoid server errors.
    if (!commercialData) return false;
    return !!commercialData.assinatura && !!commercialData.dataFormulario;
  };

  const submit = async () => {
    if (submitting) return;

    if (!hasAllRequiredFields()) {
      Alert.alert(
        'Campos obrigatórios em falta',
        'Por favor, certifique-se de que a assinatura e data foram preenchidas.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const api = await getAuthApi();
      const formData = new FormData();

      // 1. Append parceiro data
      if (commercialData) {
        formData.append("tipo_parceiro", commercialData.tipoParceiro || "");
        formData.append("designacao", commercialData.designacao || commercialData.nomeComercial || "");
        formData.append("tipo_empresa", commercialData.tipoEmpresa || "");
        formData.append("natureza_actividade", commercialData.naturezaObjecto || "");

        if (commercialData.nuit) formData.append("nuit", commercialData.nuit);
        if (commercialData.contactoAgente) formData.append("contacto_agente", commercialData.contactoAgente);

        formData.append("bairro_ref", commercialData.bancaEnderecoBairroRef || "");
        formData.append("profissao", commercialData.profissao || "");
        formData.append("assinatura_adesao", commercialData.assinatura || "");
        formData.append("data_adesao", toISODate(commercialData.dataFormulario));
        formData.append("angariador_id", "40");

        // Proprietário Principal
        if (commercialData.proprietarioNomeCompleto) formData.append("proprietario_nome_completo", commercialData.proprietarioNomeCompleto);
        if (commercialData.proprietarioContacto) formData.append("proprietario_contacto", commercialData.proprietarioContacto);

        // 2. Append endereco
        formData.append("endereco", JSON.stringify({
          cidade: commercialData.bancaEnderecoCidade || "",
          localidade: commercialData.bancaEnderecoLocalidade || "",
          avenida_rua: commercialData.bancaEnderecoAvenidaRua || "",
          numero: commercialData.bancaEnderecoNumero || "",
          quarteirao: commercialData.bancaEnderecoQuart || "",
          telefone: commercialData.bancaTelefone || "",
          celular: commercialData.bancaCelular || "",
        }));

        // 3. Append banca (with base64 fotografia)
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

        // 4. Append proprietarios
        if (commercialData.proprietarios && commercialData.proprietarios.length > 0) {
          formData.append("proprietarios", JSON.stringify(commercialData.proprietarios));
        }

        // 5. Append assistentes
        if (commercialData.assistentes && commercialData.assistentes.length > 0) {
          formData.append("assistentes", JSON.stringify(commercialData.assistentes));
        }

        // 6. Append estabelecimentos
        if (commercialData.estabelecimentos && commercialData.estabelecimentos.length > 0) {
          formData.append("estabelecimentos", JSON.stringify(commercialData.estabelecimentos));
        }
      }

      // 7. Append documentos
      if (documents.biFrenteUri) {
        formData.append("bi", {
          uri: documents.biFrenteUri,
          name: "bi_frente.pdf",
          type: "application/pdf",
        } as any);
      }
      if (documents.biVersoUri) {
        formData.append("bi", {
          uri: documents.biVersoUri,
          name: "bi_verso.pdf",
          type: "application/pdf",
        } as any);
      }
      if (documents.alvaraUri) {
        formData.append("alvara", {
          uri: documents.alvaraUri,
          name: "alvara.pdf",
          type: "application/pdf",
        } as any);
      }
      if (documents.nuitUri) {
        formData.append("nuit", {
          uri: documents.nuitUri,
          name: "nuit.pdf",
          type: "application/pdf",
        } as any);
      }

      console.log("Enviando dados para a API...");

      const response = await api.post("/api/v1/parceiros/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        navigation.replace("Success", {
          registrationId: response.data.id || "123"
        });
      } else {
        throw new Error("Falha ao criar parceiro");
      }
    } catch (err: any) {
      console.error("Erro submit:", err);
      if (err.response) {
        console.error("Backend Error:", err.response.data);
        const backendMsg = err.response.data?.error || err.response.data?.message || JSON.stringify(err.response.data);
        setError(`Erro do servidor: ${backendMsg}`);
      } else if (err.message?.includes('Network Error')) {
        setError("Erro de conexão. Verifique sua internet.");
      } else {
        setError(err.message || "Erro ao submeter formulário");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="check-circle" size={40} color={Theme.colors.primary} />
          </View>
          <Text style={styles.title}>Revisão Final</Text>
          <Text style={styles.subtitle}>
            Confirme os dados antes de submeter o formulário
          </Text>
        </View>

        {commercialData && (
          <>
            {/* Localização */}
            <ReviewCard
              title="Localização da Banca"
              icon={<MaterialIcons name="gps-fixed" size={24} color={Theme.colors.primary} />}
            >
              <ReviewItem
                label="Latitude"
                value={commercialData.latitude ? String(commercialData.latitude) : '-'}
              />
              <ReviewItem
                label="Longitude"
                value={commercialData.longitude ? String(commercialData.longitude) : '-'}
              />
              {commercialData.fotografia && (
                <View style={styles.photoInfo}>
                  <MaterialIcons name="photo-camera" size={20} color={Theme.colors.success} />
                  <Text style={styles.photoText}>Fotografia da banca anexada</Text>
                </View>
              )}
            </ReviewCard>

            {/* Assinatura e Data */}
            <ReviewCard
              title="Assinatura e Data"
              icon={<MaterialIcons name="edit" size={24} color={Theme.colors.primary} />}
            >
              <ReviewItem
                label="Assinatura"
                value={commercialData.assinatura ? '✓ Assinado' : '✗ Pendente'}
                required
              />
              <ReviewItem
                label="Data do Formulário"
                value={commercialData.dataFormulario || '-'}
                required
              />
            </ReviewCard>
          </>
        )}

        {/* Error Message */}
        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <MaterialIcons name="error" size={24} color={Theme.colors.surface} />
              <Text style={styles.errorTitle}>Erro na Submissão</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {/* Spacer for fixed footer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Footer with Submit Button */}
      <View style={[
        styles.footer,
        { paddingBottom: Math.max(20, insets.bottom + 12) }
      ]}>
        <Button
          title="Voltar"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          icon={<MaterialIcons name="arrow-back" size={20} color={Theme.colors.primary} />}
        />
        <Button
          title={submitting ? "A Submeter..." : "Submeter Agora"}
          onPress={submit}
          loading={submitting}
          style={[
            styles.submitButton,
            !hasAllRequiredFields() && styles.submitButtonDisabled
          ]}
          disabled={!hasAllRequiredFields() || submitting}
          icon={!submitting && <MaterialIcons name="send" size={20} color={Theme.colors.surface} />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  headerIcon: {
    marginBottom: Theme.spacing.sm,
  },
  title: {
    ...Theme.typography.h1,
    color: Theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  cardTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  cardContent: {
    paddingLeft: 8,
  },
  reviewItem: {
    marginBottom: Theme.spacing.md,
  },
  reviewItemLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewItemLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  requiredBadge: {
    ...Theme.typography.caption,
    color: Theme.colors.error,
    backgroundColor: Theme.colors.error + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Theme.spacing.sm,
    fontWeight: '600',
  },
  reviewItemValue: {
    ...Theme.typography.body1,
    color: Theme.colors.textPrimary,
    fontWeight: '500',
  },
  reviewItemValueEmpty: {
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  reviewItemValueRequired: {
    color: Theme.colors.error,
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  photoText: {
    ...Theme.typography.body1,
    color: Theme.colors.success,
    marginLeft: Theme.spacing.sm,
    fontWeight: '500',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  documentIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentName: {
    ...Theme.typography.body1,
    color: Theme.colors.textPrimary,
  },
  documentStatus: {
    ...Theme.typography.caption,
    fontWeight: '600',
  },
  documentStatusSuccess: {
    color: Theme.colors.success,
  },
  documentStatusWarning: {
    color: Theme.colors.warning,
  },
  documentSummary: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    alignItems: 'center',
  },
  documentSummaryText: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  errorCard: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.error,
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  errorTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.surface,
    marginLeft: Theme.spacing.sm,
    fontWeight: '600',
  },
  errorText: {
    ...Theme.typography.body1,
    color: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  spacer: {
    height: 120, // Space for fixed footer
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  backButton: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  submitButton: {
    flex: 2,
    marginLeft: Theme.spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});