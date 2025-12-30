import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { getAuthApi, getItem } from '@/config/api';

type Nav = StackNavigationProp<RootStackParamList, 'ReviewSubmit'>;
type Route = RouteProp<RootStackParamList, 'ReviewSubmit'>;

interface Props { navigation: Nav; route: Route }

export const ReviewSubmitScreen = ({ navigation, route }: Props) => {
  const { commercialData, documents } = route.params;
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const api = await getAuthApi();

      // Utilidades de mapeamento/conversão
      const toIsoDate = (ddmmyyyy?: string) => {
        if (!ddmmyyyy) return undefined;
        const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return undefined;
        const [_, dd, mm, yyyy] = m;
        return `${yyyy}-${mm}-${dd}`; // Backend espera Date; string ISO simples
      };

      // Recuperar usuário logado para atribuir angariador_id
      const userDataJson = await getItem('sirac_user_data');
      let userId = undefined;
      if (userDataJson) {
        try {
          const user = JSON.parse(userDataJson);
          userId = user.id;
        } catch (e) {
          console.warn('Falha ao parsear dados do usuário:', e);
        }
      }

      // Validações mínimas antes do envio
      if (!commercialData?.assinatura || !commercialData?.dataFormulario) {
        throw new Error('Assinatura e data de adesão são obrigatórias.');
      }

      // FormData para envio multipart
      const formData = new FormData();

      // --- Campos Textuais ---
      const tipo_parceiro = commercialData?.tipoParceiro || (commercialData ? 'MERCHANT' : 'AGENTE');
      formData.append('tipo_parceiro', tipo_parceiro);

      const designacao = commercialData?.designacao || commercialData?.nomeComercial || '';
      formData.append('designacao', designacao);

      // Adicionar Contacto do Agente (Vital para SGD)
      if (commercialData?.contactoAgente) {
        formData.append('contacto_agente', commercialData.contactoAgente);
      } else if (commercialData?.celular) {
        // Fallback para celular se contactoAgente não estiver preenchido (embora o form tenha ambos)
        formData.append('contacto_agente', commercialData.celular);
      }

      formData.append('tipo_empresa', commercialData?.tipoEmpresa || '');
      if (commercialData?.naturezaObjecto) formData.append('natureza_actividade', commercialData.naturezaObjecto);
      if (commercialData?.nuit) formData.append('nuit', commercialData.nuit);
      if (commercialData?.banco) formData.append('banco', commercialData.banco);
      if (commercialData?.numeroConta) formData.append('numero_conta', commercialData.numeroConta);
      if (commercialData?.enderecoBairroRef) formData.append('bairro_ref', commercialData.enderecoBairroRef);
      if (commercialData?.profissao) formData.append('profissao', commercialData.profissao);

      // Assinatura e Data
      formData.append('assinatura_adesao', commercialData.assinatura);
      const dataAdesao = toIsoDate(commercialData.dataFormulario);
      if (dataAdesao) formData.append('data_adesao', dataAdesao);

      // Angariador ID
      if (userId) formData.append('angariador_id', String(userId));

      // Objetos Complexos (Backend faz json.loads se receber string)
      const endereco = {
        cidade: commercialData?.enderecoCidade || '',
        localidade: commercialData?.enderecoLocalidade,
        avenida_rua: commercialData?.enderecoAvenidaRua,
        numero: commercialData?.enderecoNumero,
        quarteirao: commercialData?.enderecoQuart,
        telefone: commercialData?.telefone,
        celular: commercialData?.celular,
      };
      formData.append('endereco', JSON.stringify(endereco));

      const proprietarios = Array.isArray(commercialData?.proprietarios) && commercialData!.proprietarios!.length > 0
        ? commercialData!.proprietarios!.map((p: any) => ({
          nome: p?.nome,
          email: p?.email,
          contacto: p?.contacto,
        }))
        : (commercialData?.proprietarioNomeCompleto
          ? [{
            nome: commercialData.proprietarioNomeCompleto,
            email: commercialData.proprietarioEmail,
            contacto: commercialData.proprietarioContacto,
          }]
          : []);
      formData.append('proprietarios', JSON.stringify(proprietarios));

      const assistentes = Array.isArray(commercialData?.assistentes) && commercialData!.assistentes!.length > 0
        ? commercialData!.assistentes!
          .filter((a: any) => !!a?.nomeCompleto && a!.nomeCompleto!.trim().length > 0)
          .map((a: any) => ({
            nome_completo: a!.nomeCompleto!,
            contacto: a?.contacto,
          }))
        : [];
      formData.append('assistentes', JSON.stringify(assistentes));

      const estabelecimentos = Array.isArray(commercialData?.estabelecimentos) && commercialData!.estabelecimentos!.length > 0
        ? commercialData!.estabelecimentos!.map((e: any) => ({
          nome: e?.nome || 'Estabelecimento',
          provincia_localidade: e?.provinciaLocalidade,
          endereco_bairro: e?.enderecoBairro,
        }))
        : [];
      formData.append('estabelecimentos', JSON.stringify(estabelecimentos));

      // --- Arquivos (PDFs) ---
      // Helper para anexar arquivo
      const appendFile = (key: string, uri?: string, filename?: string) => {
        if (!uri) return;
        formData.append(key, {
          uri: uri,
          name: filename || `${key}.pdf`,
          type: 'application/pdf',
        } as any);
      };

      // Mapeamento Mobile -> Backend Request Files
      // Backend espera: 'bi', 'nuit', 'alvara', 'contrato'
      // Mobile tem: biFrenteUri, biVersoUri, nuitUri, alvaraUri

      // Enviamos Bi Frente como 'bi'
      appendFile('bi', documents.biFrenteUri, `bi_frente_${Date.now()}.pdf`);

      // Enviamos Nuit como 'nuit'
      appendFile('nuit', documents.nuitUri, `nuit_${Date.now()}.pdf`);

      // Enviamos Alvara como 'alvara'
      appendFile('alvara', documents.alvaraUri, `alvara_${Date.now()}.pdf`);

      // Backend não tem campo explícito para BI Verso na rota atual, mas se necessário, poderíamos enviar como 'contrato' ou ignorar.
      // Por enquanto, enviamos apenas a frente conforme mapeamento padrão.

      // Enviar para API (prefixo correto no backend)
      // Ajustar headers para multipart é feito automaticamente pelo axios/fetch ao passar FormData, 
      // mas precisamos garantir que o interceptor não force application/json
      const res = await api.post('/api/v1/parceiros/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
          return data; // Evita que o axios tente stringify o FormData
        },
      });

      const parceiro = res.data?.parceiro || res.data;
      const registrationId = String(parceiro?.id || '--------');
      navigation.replace('Success', { registrationId });
    } catch (e: any) {
      console.error('Erro submit:', e);
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Falha ao submeter cadastro. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
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

      <View style={styles.footer}>
        <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
        <Button title="Submeter" onPress={submit} loading={loading} style={{ flex: 2 }} />
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
  footer: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.lg },
});
