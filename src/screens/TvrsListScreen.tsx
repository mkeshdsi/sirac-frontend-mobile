import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { Button, Input } from '@/components';
import { listTvrs, updateTvrPassword } from '@/services/apiResources';

export const TvrsListScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTvr, setSelectedTvr] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchData = async () => {
    const data = await listTvrs();
    setItems(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openTvrModal = (item: any) => {
    setSelectedTvr(item);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowPassword(false);
  };

  const closeTvrModal = () => {
    if (savingPassword) return;
    setSelectedTvr(null);
  };

  const onUpdatePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!selectedTvr?.id) {
      setPasswordError('TVR inválido.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As palavras-passe não coincidem.');
      return;
    }

    setSavingPassword(true);
    try {
      await updateTvrPassword(selectedTvr.id, { password: newPassword });
      setPasswordSuccess('Password temporária atualizada. O TVR deverá alterá-la no próximo login.');
      setNewPassword('');
      setConfirmPassword('');
      await fetchData();
    } catch (e: any) {
      setPasswordError(e?.response?.data?.msg || 'Não foi possível atualizar a password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const canUpdatePassword = newPassword.length >= 6 && newPassword === confirmPassword && !savingPassword;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>A carregar TVRs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[Theme.colors.primary, Theme.colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>TVRs</Text>
            <Text style={styles.headerSubtitle}>{items.length} técnico(s) de venda registado(s)</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.78} onPress={() => openTvrModal(item)}>
            <View style={styles.iconWrap}>
              <Ionicons name="briefcase-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.nome || `TVR #${item.id}`}</Text>
                <View style={[styles.statusBadge, item.is_active ? styles.statusOn : styles.statusOff]}>
                  <Text style={[styles.statusText, item.is_active ? styles.statusTextOn : styles.statusTextOff]}>
                    {item.is_active ? 'Ativo' : 'Inativo'}
                  </Text>
                </View>
              </View>
              {!!item.msisdn && <Text style={styles.detail}>Contacto: {item.msisdn}</Text>}
              {!!item.email && <Text style={styles.detail}>Email: {item.email}</Text>}
              {!!item.bi && <Text style={styles.detail}>BI: {item.bi}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.gray400} />
          </TouchableOpacity>
        ))}

        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={42} color={Theme.colors.border} />
            <Text style={styles.emptyTitle}>Sem TVRs</Text>
            <Text style={styles.emptySubtitle}>Ainda não existem TVRs para listar.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedTvr} transparent animationType="fade" onRequestClose={closeTvrModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="briefcase-outline" size={22} color={Theme.colors.primary} />
              </View>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>{selectedTvr?.nome || 'TVR'}</Text>
                {!!selectedTvr?.msisdn && <Text style={styles.modalSubtitle}>{selectedTvr.msisdn}</Text>}
              </View>
              <TouchableOpacity onPress={closeTvrModal} style={styles.closeBtn} activeOpacity={0.75}>
                <Ionicons name="close" size={20} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBlock}>
              {!!selectedTvr?.email && <Text style={styles.infoText}>Email: {selectedTvr.email}</Text>}
              {!!selectedTvr?.bi && <Text style={styles.infoText}>BI: {selectedTvr.bi}</Text>}
              <Text style={styles.infoText}>Estado: {selectedTvr?.is_active ? 'Ativo' : 'Inativo'}</Text>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.sectionTitle}>Atualizar password</Text>
            <Text style={styles.helperText}>Esta será a password temporária usada pelo TVR no próximo login.</Text>

            <Input
              label="Nova palavra-passe"
              placeholder="Digite a nova palavra-passe"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Theme.colors.textSecondary} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={Theme.colors.textSecondary} />
                </TouchableOpacity>
              }
              required
            />
            <Input
              label="Confirmar palavra-passe"
              placeholder="Confirme a nova palavra-passe"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Theme.colors.textSecondary} />}
              required
            />

            {!!passwordError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color={Theme.colors.error} />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            )}
            {!!passwordSuccess && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Theme.colors.success} />
                <Text style={styles.successText}>{passwordSuccess}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="outline" onPress={closeTvrModal} disabled={savingPassword} style={styles.actionButton} />
              <Button title="Guardar" onPress={onUpdatePassword} loading={savingPassword} disabled={!canUpdatePassword} iconName="checkmark-circle-outline" iconPosition="right" style={styles.actionButton} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.background, gap: 12 },
  loadingText: { color: Theme.colors.textSecondary, fontSize: 14 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, color: 'white', fontWeight: '800' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  scroll: { flex: 1, marginTop: -14 },
  content: { padding: 16, paddingTop: 24, paddingBottom: 48 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Theme.colors.border, elevation: 2 },
  iconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: `${Theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: Theme.colors.textPrimary },
  detail: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusOn: { backgroundColor: `${Theme.colors.primary}18` },
  statusOff: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextOn: { color: Theme.colors.primary },
  statusTextOff: { color: Theme.colors.textSecondary },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 17, color: Theme.colors.textPrimary, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.42)', justifyContent: 'center', padding: 18 },
  modalPanel: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Theme.colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  modalIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${Theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  modalTitleWrap: { flex: 1 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Theme.colors.textPrimary },
  modalSubtitle: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 3 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.gray100 },
  infoBlock: { backgroundColor: Theme.colors.gray50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Theme.colors.border },
  infoText: { fontSize: 12, color: Theme.colors.textSecondary, marginBottom: 4 },
  modalDivider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 4 },
  helperText: { fontSize: 12, color: Theme.colors.textSecondary, lineHeight: 18, marginBottom: 14 },
  eyeIcon: { padding: 4 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 10, gap: 8 },
  errorText: { flex: 1, fontSize: 12, color: Theme.colors.error },
  successContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${Theme.colors.success}12`, borderRadius: 12, padding: 12, marginBottom: 10, gap: 8 },
  successText: { flex: 1, fontSize: 12, color: Theme.colors.success, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flex: 1 },
});
