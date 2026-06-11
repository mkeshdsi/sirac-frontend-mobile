import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated, Switch, Modal, KeyboardAvoidingView, Platform, Alert, RefreshControl } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getAngariadoresGrouped, listMyAngariadores, toggleAngariadorActive, updateAngariadorPassword } from '@/services/apiResources';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CardItem = ({ item, isExpanded, onToggle, onToggleActive, onOpenPassword }: any) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle(item.tvr_id);
  };

  const tvrName = item.tvr_nome || (item.tvr_id === 0 ? 'Sem TVR (Admins)' : 'Desconhecido');

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity style={styles.cardHeader} onPress={handlePress} activeOpacity={0.85}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="briefcase-outline" size={18} color={Theme.colors.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.tvrName}>{tvrName}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="people-outline" size={11} color={Theme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.totalBadge}>{item.total_angariadores} Angariador(es)</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.chevronWrap, isExpanded && styles.chevronWrapActive]}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Collapsible collapsed={!isExpanded}>
        <View style={styles.divider} />
        <View style={styles.collapsibleContent}>
          {item.angariadores.map((ang: any, idx: number) => (
            <View key={idx} style={[styles.angariadorRow, idx === item.angariadores.length - 1 && { borderBottomWidth: 0 }]}>
              {ang.bi_frente ? (
                <Image source={{ uri: ang.bi_frente }} style={styles.angariadorImg} />
              ) : (
                <View style={[styles.angariadorImg, styles.placeholderImg]}>
                  <Ionicons name="person-outline" size={16} color={Theme.colors.textSecondary} />
                </View>
              )}
              <View style={styles.angariadorInfo}>
                <Text style={styles.angariadorName}>{ang.nome}</Text>
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={11} color={Theme.colors.textSecondary} style={{ marginRight: 3 }} />
                  <Text style={styles.angariadorContact}>{ang.msisdn}</Text>
                  <Text style={styles.contactDot}> · </Text>
                  <Ionicons name="mail-outline" size={11} color={Theme.colors.textSecondary} style={{ marginRight: 3 }} />
                  <Text style={styles.angariadorContact}>{ang.email}</Text>
                </View>
              </View>
              <View style={styles.activeControl}>
                <Text style={[styles.activeLabel, ang.is_active ? styles.activeLabelOn : styles.activeLabelOff]}>
                  {ang.is_active ? 'Ativo' : 'Inativo'}
                </Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.passwordAction} onPress={() => onOpenPassword(ang)} activeOpacity={0.75}>
                    <Ionicons name="key-outline" size={16} color={Theme.colors.primary} />
                  </TouchableOpacity>
                  <Switch
                    value={!!ang.is_active}
                    onValueChange={(value) => onToggleActive(ang.id, value)}
                    trackColor={{ false: '#d1d5db', true: `${Theme.colors.primary}55` }}
                    thumbColor={ang.is_active ? Theme.colors.primary : '#f4f4f5'}
                  />
                </View>
              </View>
            </View>
          ))}
          {item.angariadores.length === 0 && (
            <View style={styles.emptyInline}>
              <Ionicons name="person-remove-outline" size={22} color={Theme.colors.border} />
              <Text style={styles.emptyInlineText}>Nenhum angariador encontrado.</Text>
            </View>
          )}
        </View>
      </Collapsible>
    </Animated.View>
  );
};

export const AngariadoresListScreen = ({ navigation }: any) => {
  const { userRole, userData } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSections, setActiveSections] = useState<number[]>([]);
  const [selectedAngariador, setSelectedAngariador] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (userRole === 'tvr') {
      const meusAngariadores = await listMyAngariadores();
      setData([{
        tvr_id: userData?.id || 0,
        tvr_nome: userData?.nome || userData?.name || 'Meus Angariadores',
        total_angariadores: meusAngariadores.length,
        angariadores: meusAngariadores,
      }]);
    } else {
      const res = await getAngariadoresGrouped();
      if (res && res.data) setData(res.data);
    }
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSection = (id: number) => {
    setActiveSections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleActive = async (angariadorId: number, isActive: boolean) => {
    const angariador = data.flatMap(group => group.angariadores || []).find((ang: any) => ang.id === angariadorId);

    try {
      const result = await toggleAngariadorActive(angariadorId, isActive);
      const serverStatus = !!(result?.data?.is_active ?? isActive);
      setData(prev => prev.map(group => ({
        ...group,
        angariadores: group.angariadores.map((ang: any) =>
          ang.id === angariadorId ? { ...ang, is_active: serverStatus } : ang
        ),
      })));
      Alert.alert(
        'Status atualizado',
        `${angariador?.nome || 'Angariador'} foi marcado como ${serverStatus ? 'Ativo' : 'Inativo'}.`
      );
      fetchData();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível alterar o status. A alteração foi revertida.');
      fetchData();
    }
  };

  const closePasswordModal = () => {
    setSelectedAngariador(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleUpdatePassword = async () => {
    if (!selectedAngariador) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('As palavras-passe não coincidem.');
      return;
    }

    setPasswordLoading(true);
    try {
      await updateAngariadorPassword(selectedAngariador.id, {
        email: selectedAngariador.email,
        new_password: newPassword,
      });
      setPasswordSuccess('Password atualizada com sucesso.');
      setTimeout(closePasswordModal, 900);
    } catch (e: any) {
      setPasswordError(e?.response?.data?.msg || 'Não foi possível atualizar a password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>A carregar dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshData} style={styles.backBtn} activeOpacity={0.7} disabled={refreshing}>
            <Ionicons name="refresh" size={21} color="white" />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>{data.length} Grupos</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Angariadores</Text>
        <Text style={styles.headerSubtitle}>Listagem agrupada por Técnico de Venda</Text>
      </LinearGradient>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} colors={[Theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {data.map((item, index) => (
          <CardItem
            key={index}
            item={item}
            isExpanded={activeSections.includes(item.tvr_id)}
            onToggle={toggleSection}
            onToggleActive={handleToggleActive}
            onOpenPassword={setSelectedAngariador}
          />
        ))}

        {data.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={40} color={Theme.colors.border} />
            </View>
            <Text style={styles.emptyTitle}>Sem dados disponíveis</Text>
            <Text style={styles.emptySubtitle}>Não foram encontrados angariadores registados.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedAngariador} transparent animationType="fade" onRequestClose={closePasswordModal}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar password</Text>
            <Text style={styles.modalSubtitle}>{selectedAngariador?.nome}</Text>

            <Input label="Email" value={selectedAngariador?.email || ''} editable={false} />
            <Input label="Nova password" secureTextEntry value={newPassword} onChangeText={setNewPassword} required />
            <Input label="Confirmar nova password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} required />

            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            {!!passwordSuccess && <Text style={styles.successText}>{passwordSuccess}</Text>}

            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="outline" style={styles.modalActionBtn} onPress={closePasswordModal} />
              <Button
                title="Guardar"
                style={styles.modalActionBtn}
                loading={passwordLoading}
                disabled={!newPassword || newPassword !== confirmPassword}
                onPress={handleUpdatePassword}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    letterSpacing: 0.3,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 10,
    left: -20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerPillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // ── List ────────────────────────────────────────────────
  listContainer: { flex: 1, marginTop: -16 },
  listContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },

  // ── Card ────────────────────────────────────────────────
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: `${Theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardHeaderText: { flex: 1 },
  tvrName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Theme.colors.primary}15`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  totalBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: 0.3,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronWrapActive: {
    backgroundColor: Theme.colors.gray200,
  },

  // ── Collapsible ─────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginHorizontal: 16,
    opacity: 0.6,
  },
  collapsibleContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Theme.colors.surface,
  },
  angariadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  angariadorImg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    marginRight: 12,
  },
  placeholderImg: {
    backgroundColor: '#EEF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  angariadorInfo: { flex: 1 },
  angariadorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  activeControl: {
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 98,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  activeLabelOn: {
    color: Theme.colors.primary,
  },
  activeLabelOff: {
    color: Theme.colors.textSecondary,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passwordAction: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Theme.colors.primary}15`,
  },
  angariadorContact: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  contactDot: {
    fontSize: 12,
    color: Theme.colors.border,
    fontWeight: '700',
  },

  // ── Empty states ─────────────────────────────────────────
  emptyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  emptyInlineText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 22,
    padding: Theme.spacing.lg,
  },
  modalTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Theme.spacing.sm,
  },
  modalActionBtn: {
    flex: 1,
  },
  errorText: {
    color: Theme.colors.error,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  successText: {
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    fontWeight: '600',
  },
});
