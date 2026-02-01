import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Alert } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { getAuthApi } from '@/config/api';
import * as FileSystem from 'expo-file-system/legacy';

type Nav = StackNavigationProp<RootStackParamList, 'ReviewSubmit'>;
type Route = RouteProp<RootStackParamList, 'ReviewSubmit'>;

interface Props { navigation: Nav; route: Route }

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { commercialData, documents } = route.params;
  const [submitting, setSubmitting] = useState(false);
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

      // 1. Append parceiro data
      if (commercialData) {
        formData.append("tipo_parceiro", commercialData.tipoParceiro || "");
        formData.append("designacao", commercialData.nomeComercial || "");
        formData.append("tipo_empresa", commercialData.tipoEmpresa || "");
        formData.append("natureza_actividade", commercialData.naturezaObjecto || "");

        // Evitar enviar string vazia para campos únicos se não preenchidos
        if (commercialData.nuit) formData.append("nuit", commercialData.nuit);
        if (commercialData.contactoAgente) formData.append("contacto_agente", commercialData.contactoAgente);

        formData.append("bairro_ref", commercialData.enderecoBairroRef || "");
        formData.append("profissao", commercialData.profissao || "");
        formData.append("assinatura_adesao", commercialData.assinatura || "");
        formData.append("data_adesao", toISODate(commercialData.dataFormulario));
        formData.append("angariador_id", "40");

        // 2. Append endereco (as JSON)
        formData.append("endereco", JSON.stringify({
          cidade: commercialData.enderecoCidade || "",
          localidade: commercialData.enderecoLocalidade || "",
          avenida_rua: commercialData.enderecoAvenidaRua || "",
          numero: commercialData.enderecoNumero || "",
          quarteirao: commercialData.enderecoQuart || "",
          telefone: commercialData.telefone || "",
          celular: commercialData.celular || "",
        }));

        // 3. Append banca (as JSON with base64 fotografia)
        if (commercialData.latitude !== null && commercialData.longitude !== null) {
          let base64Foto = "";
          if (commercialData.fotografia) {
            try {
              base64Foto = await FileSystem.readAsStringAsync(commercialData.fotografia, {
                encoding: 'base64',
              });
              // Se não tiver o prefixo, adicione (opcional, dependendo do backend, mas comum)
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
            fotografia: base64Foto, // Foto agora vai aqui como Base64
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

      // 7. Append documentos (PDFs)
      // O backend espera o nome do campo como 'bi', 'nuit', 'alvara'
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

      console.log("FormData Entries:");
      // @ts-ignore
      for (let [key, value] of formData.entries()) {
        if (typeof value === "string") {
          console.log(key, value);
        } else {
          console.log(key, (value as any).name);
        }
      }

      const response = await api.post("/api/v1/parceiros/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        navigation.replace("Success", { registrationId: "123" });
      } else {
        throw new Error("Falha ao criar parceiro");
      }
    } catch (err: any) {
      console.error("Erro submit (Full details):", err);
      if (err.response) {
        console.error("Backend Error Data:", err.response.data);
        const backendMsg = err.response.data?.error || err.response.data?.message || JSON.stringify(err.response.data);
        setError(`Erro: ${backendMsg}`);
      } else {
        setError(err.message || "Erro ao submeter formulário");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Revisão</Text>

      {/* Secção Dados Pessoais removida por não ser necessária para o envio à API */}

      {commercialData && (
        <Card style={styles.card}>
          <Text style={styles.section}>Dados Comerciais</Text>
          <Text style={styles.item}>Nome Comercial: {commercialData.nomeComercial}</Text>
          <Text style={styles.item}>NUIT: {commercialData.nuit}</Text>
          <Text style={styles.item}>Alvará: {commercialData.alvara}</Text>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.section}>Documentos</Text>
        <Text style={styles.item}>BI Frente: {documents.biFrenteUri ? 'OK' : 'Falta'}</Text>
        <Text style={styles.item}>BI Verso: {documents.biVersoUri ? 'OK' : 'Falta'}</Text>
        <Text style={styles.item}>NUIT: {documents.nuitUri ? 'OK' : 'Falta'}</Text>
        <Text style={styles.item}>Alvará: {documents.alvaraUri ? 'OK' : 'Falta'}</Text>
      </Card>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <View style={styles.footer}>
        <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
        <Button title="Submeter" onPress={submit} loading={submitting} style={{ flex: 2 }} disabled={!commercialData} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.lg },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.md },
  section: { ...Theme.typography.h4, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.sm },
  item: { ...Theme.typography.body2, color: Theme.colors.textSecondary, marginBottom: 2 },
  card: { marginBottom: Theme.spacing.lg },
  errorCard: { backgroundColor: Theme.colors.error, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  errorText: { color: Theme.colors.surface, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.lg },
});