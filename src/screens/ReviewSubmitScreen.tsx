import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Alert } from 'react-native';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import axios from 'axios';

 type Nav = StackNavigationProp<RootStackParamList, 'ReviewSubmit'>;
 type Route = RouteProp<RootStackParamList, 'ReviewSubmit'>;

 interface Props { navigation: Nav; route: Route }

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { personalData, commercialData, documents } = route.params;
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      // TODO: ajustar a URL do backend quando disponível
      await new Promise((r) => setTimeout(r, 800));
      const registrationId = Math.random().toString(36).slice(2, 8).toUpperCase();
      navigation.replace('Success', { registrationId });
    } catch (e) {
      Alert.alert('Erro', 'Falha ao submeter cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Revisão</Text>

      <Card style={styles.card}>
        <Text style={styles.section}>Dados Pessoais</Text>
        <Text style={styles.item}>Nome: {personalData.nome}</Text>
        <Text style={styles.item}>Telefone: {personalData.telefone}</Text>
        <Text style={styles.item}>BI: {personalData.biNumero}</Text>
      </Card>

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
