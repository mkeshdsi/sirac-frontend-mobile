import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Alert } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { getAuthApi } from '@/config/api';

type Nav = StackNavigationProp<RootStackParamList, 'ReviewSubmit'>;
type Route = RouteProp<RootStackParamList, 'ReviewSubmit'>;

interface Props { navigation: Nav; route: Route }

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { commercialData, documents } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        formData.append("nuit", commercialData.nuit || "");
        formData.append("bairro_ref", commercialData.enderecoBairroRef || "");
        formData.append("profissao", commercialData.profissao || "");
        formData.append("assinatura_adesao", commercialData.assinatura || "");
        formData.append("data_adesao", commercialData.dataFormulario || "");
        formData.append("angariador_id", "40");
        formData.append("contacto_agente", commercialData.contactoAgente || "");

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
          formData.append("banca", JSON.stringify({
            latitude: commercialData.latitude,
            longitude: commercialData.longitude,
            fotografia: commercialData.fotografia  // Envia base64 diretamente
          }));
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
      if (documents.biFrenteUri) {
        formData.append("bi_frente", {
          uri: documents.biFrenteUri,
          name: "bi_frente.pdf",
          type: "application/pdf",
        } as any);
      }
      if (documents.biVersoUri) {
        formData.append("bi_verso", {
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
      console.error("Erro submit:", err);
      setError(err.message || "Erro ao submeter formulário");
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