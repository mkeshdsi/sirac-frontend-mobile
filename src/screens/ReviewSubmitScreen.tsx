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

      // Definir tipo_parceiro a partir do formulário (AGENTE|MERCHANT) ou fallback pelo fluxo
      const tipo_parceiro = commercialData?.tipoParceiro || (commercialData ? 'MERCHANT' : 'AGENTE');

      // Montar payload conforme backend (app.models.parceiro.Parceiro)
      const payload: any = {
        tipo_parceiro,
        designacao: commercialData?.designacao || commercialData?.nomeComercial || '',
        // tipo_empresa já vem conforme enum da API (SOCIEDADE|INDIVIDUAL)
        tipo_empresa: commercialData?.tipoEmpresa,
        natureza_actividade: commercialData?.naturezaObjecto || undefined,
        nuit: commercialData?.nuit || undefined,
        banco: commercialData?.banco || undefined,
        numero_conta: commercialData?.numeroConta || undefined,
        bairro_ref: commercialData?.enderecoBairroRef || undefined,
        profissao: commercialData?.profissao || undefined,
        assinatura_adesao: commercialData?.assinatura || undefined,
        data_adesao: toIsoDate(commercialData?.dataFormulario),
        // IDs opcionais (FKs) se fornecidos
        angariador_id: commercialData?.angariadorId ? Number(commercialData.angariadorId) : undefined,
        aprovador_id: commercialData?.aprovadorId ? Number(commercialData.aprovadorId) : undefined,
        validador_id: commercialData?.validadorId ? Number(commercialData.validadorId) : undefined,
        // FKs opcionais (angariador_id, aprovador_id, validador_id) não utilizados aqui
        endereco: commercialData ? {
          cidade: commercialData.enderecoCidade!,
          localidade: commercialData.enderecoLocalidade || undefined,
          avenida_rua: commercialData.enderecoAvenidaRua || undefined,
          numero: commercialData.enderecoNumero || undefined,
          quarteirao: commercialData.enderecoQuart || undefined,
          telefone: commercialData.telefone || undefined,
          celular: commercialData.celular || undefined,
        } : undefined,
        proprietarios: Array.isArray(commercialData?.proprietarios) && commercialData!.proprietarios!.length > 0
          ? commercialData!.proprietarios!.map((p) => ({
              nome: p?.nome || undefined,
              email: p?.email || undefined,
              contacto: p?.contacto || undefined,
            }))
          : (commercialData?.proprietarioNomeCompleto
              ? [{
                  nome: commercialData.proprietarioNomeCompleto,
                  email: commercialData.proprietarioEmail || undefined,
                  contacto: commercialData.proprietarioContacto || undefined,
                }]
              : []),
        assistentes: Array.isArray(commercialData?.assistentes) && commercialData!.assistentes!.length > 0
          ? commercialData!.assistentes!
              .filter((a) => !!a?.nomeCompleto && a!.nomeCompleto!.trim().length > 0)
              .map((a) => ({
                nome_completo: a!.nomeCompleto!,
                contacto: a?.contacto || undefined,
              }))
          : [],
        estabelecimentos: Array.isArray(commercialData?.estabelecimentos) && commercialData!.estabelecimentos!.length > 0
          ? commercialData!.estabelecimentos!.map((e) => ({
              nome: e?.nome || 'Estabelecimento',
              provincia_localidade: e?.provinciaLocalidade || undefined,
              endereco_bairro: e?.enderecoBairro || undefined,
            }))
          : ((commercialData?.substituicaoNomeAgente || commercialData?.substituicaoProvinciaLocalidade || commercialData?.substituicaoEnderecoBairro)
              ? [{
                nome: commercialData?.substituicaoNomeAgente || 'Estabelecimento',
                provincia_localidade: commercialData?.substituicaoProvinciaLocalidade || undefined,
                endereco_bairro: commercialData?.substituicaoEnderecoBairro || undefined,
              }]
              : []),
      };

      // Validações mínimas antes do envio (parcial, backend também valida)
      if (!payload.assinatura_adesao || !payload.data_adesao) {
        throw new Error('Assinatura e data de adesão são obrigatórias.');
      }
      if (!payload.designacao || !payload.tipo_empresa || !payload.endereco?.cidade) {
        throw new Error('Designação, tipo de empresa e cidade são obrigatórios.');
      }

      // Enviar para API (prefixo correto no backend)
      const res = await api.post('/api/v1/parceiros/', payload);
      const parceiro = res.data?.parceiro || res.data;
      const registrationId = String(parceiro?.id || '--------');
      navigation.replace('Success', { registrationId });
    } catch (e: any) {
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
        <Text style={styles.item}>Alvará: {documents.alvaraUri ? 'OK' : 'Falta'}</Text>
        <Text style={styles.item}>Comprov. Residência: {documents.comprovativoResidenciaUri ? 'OK' : 'Falta'}</Text>
        <Text style={styles.item}>Foto Perfil: {documents.fotoPerfilUri ? 'OK' : 'Falta'}</Text>
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
