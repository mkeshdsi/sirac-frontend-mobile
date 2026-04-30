import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components';
import { Theme } from '@/constants/theme';
import { cadastrarAngariador } from '@/services/apiResources';
import * as ImagePicker from 'expo-image-picker';

export const AngariadorDataFormScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    msisdn: '',
    bi_frente: '',
    bi_verso: ''
  });

  const pickImage = async (field: 'bi_frente' | 'bi_verso') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de permissão para aceder à galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets[0].base64) {
      setFormData(prev => ({ 
        ...prev, 
        [field]: `data:image/jpeg;base64,${result.assets[0].base64}` 
      }));
    }
  };

  const onSubmit = async () => {
    if (!formData.nome || !formData.email || !formData.msisdn) {
      Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await cadastrarAngariador(formData);
      if (result && result.message) {
        Alert.alert('Sucesso', 'Angariador cadastrado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Erro', 'Falha ao cadastrar. Tente novamente.');
      }
    } catch (e: any) {
      Alert.alert('Erro', 'Ocorreu um erro no servidor.');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = formData.nome && formData.email && formData.msisdn && formData.bi_frente && formData.bi_verso;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Novo Angariador</Text>
          <Text style={styles.subtitle}>Preencha os dados básicos e anexe os documentos</Text>
        </View>

        <Input
          label="Nome Completo *"
          placeholder="Ex: João Silva"
          value={formData.nome}
          onChangeText={(t) => setFormData(prev => ({ ...prev, nome: t }))}
          required
        />

        <Input
          label="Email *"
          placeholder="joao@email.com"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(t) => setFormData(prev => ({ ...prev, email: t }))}
          required
        />

        <Input
          label="Contacto (MSISDN) *"
          placeholder="Ex: +258840000000"
          keyboardType="phone-pad"
          value={formData.msisdn}
          onChangeText={(t) => setFormData(prev => ({ ...prev, msisdn: t }))}
          required
        />

        <View style={styles.docsSection}>
          <Text style={styles.docsTitle}>Documentos (Imagens)</Text>

          <Button 
            title={formData.bi_frente ? "BI Frente (Anexado)" : "Anexar BI Frente *"}
            onPress={() => pickImage('bi_frente')}
            iconName={formData.bi_frente ? "checkmark-circle" : "camera"}
            type={formData.bi_frente ? "primary" : "outline"}
            style={styles.docBtn}
          />

          <Button 
            title={formData.bi_verso ? "BI Verso (Anexado)" : "Anexar BI Verso *"}
            onPress={() => pickImage('bi_verso')}
            iconName={formData.bi_verso ? "checkmark-circle" : "camera"}
            type={formData.bi_verso ? "primary" : "outline"}
            style={styles.docBtn}
          />
        </View>

        <Button
          title="Salvar Angariador"
          onPress={onSubmit}
          loading={loading}
          disabled={!isComplete}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: Theme.spacing.lg },
  header: { marginBottom: Theme.spacing.xl },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 4 },
  docsSection: { marginTop: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  docsTitle: { ...Theme.typography.h4, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.sm },
  docBtn: { marginBottom: Theme.spacing.sm },
  submitBtn: { marginTop: Theme.spacing.lg },
});
