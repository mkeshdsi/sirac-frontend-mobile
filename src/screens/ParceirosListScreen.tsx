import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getParceirosGroupedDetailed, listMyAngariadores, listParceiros, getParceiro, getAllUsers, listTvrs } from '@/services/apiResources';
import { Modal } from 'react-native';
import Constants from 'expo-constants';

const creatorTypeLabel = (type?: string) => {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'tvr') return 'TVR';
  if (normalized === 'angariador') return 'Angariador';
  if (normalized === 'user') return 'Colaborador';
  return 'Origem';
};

const isEwpCreated = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value || '').toLowerCase();
  return ['1', 'true', 'sim', 'yes'].includes(normalized);
};

const partnerStatusLabel = (item: any) => {
  if (isEwpCreated(item?.criado_ewp)) return 'Ativo';

  const state = item?.estado_validacao;
  const normalized = String(state || '').toUpperCase();
  if (normalized === 'PENDENTE') return 'Pendente';
  if (normalized === 'APROVADO') return 'Aprovado';
  if (normalized === 'REJEITADO') return 'Rejeitado';
  if (normalized === 'VALIDADO') return 'Validado';
  if (normalized === 'INVALIDADO') return 'Invalidado';
  return state || 'Sem estado';
};

const partnerStatusTone = (item: any) => {
  if (isEwpCreated(item?.criado_ewp)) return 'success';

  const state = item?.estado_validacao;
  const normalized = String(state || '').toUpperCase();
  if (normalized === 'APROVADO' || normalized === 'VALIDADO') return 'success';
  if (normalized === 'REJEITADO' || normalized === 'INVALIDADO') return 'danger';
  return 'warning';
};

const partnerIsRejeitado = (item: any) => {
  const normalized = String(item?.estado_validacao || '').toUpperCase();
  return normalized === 'REJEITADO' || normalized === 'INVALIDADO';
};

const userIsCreator = (item: any, userRole: any, userData: any) => {
  if (!item || !userRole || !userData) return false;
  const partnerType = String(item.angariador_type || '').toLowerCase();
  let currentType: string = '';
  if (userRole === 'user') currentType = 'user';
  if (userRole === 'angariador') currentType = 'angariador';
  if (userRole === 'tvr') currentType = 'tvr';
  
  const typesMatch = partnerType === currentType;
  const idsMatch = Number(item.angariador_id) === Number(userData.id);
  return typesMatch && idsMatch;
};

type FilterType = 'ALL' | 'PENDENTE' | 'ATIVO' | 'REJEITADO';

export const ParceirosListScreen = ({ navigation }: any) => {
  const { userRole, userData } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedParceiro, setSelectedParceiro] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allAngariadores, setAllAngariadores] = useState<any[]>([]);
  const [allTvrs, setAllTvrs] = useState<any[]>([]);

  const fetchAllPeople = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
      
      const angariadores = await listMyAngariadores();
      setAllAngariadores(angariadores);
      
      const tvrs = await listTvrs();
      setAllTvrs(tvrs);
    } catch (e) {
      console.error("Error fetching people:", e);
    }
  };

  const getAuthorName = (userId: number) => {
    // Check users first
    const user = allUsers.find(u => u.id === userId);
    if (user?.name) {
      return user.name;
    }

    // Check angariadores
    const angariador = allAngariadores.find(a => a.id === userId);
    if (angariador?.nome) {
      return angariador.nome;
    }

    // Check tvrs
    const tvr = allTvrs.find(t => t.id === userId);
    if (tvr?.nome) {
      return tvr.nome;
    }

    return `Usuário ${userId}`;
  };

  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDENTE') return String(item.estado_validacao || '').toUpperCase() === 'PENDENTE' && !isEwpCreated(item.criado_ewp);
    if (filter === 'ATIVO') return isEwpCreated(item.criado_ewp);
    if (filter === 'REJEITADO') return partnerIsRejeitado(item);
    return true;
  });

  const hasRejeitados = items.some(item => partnerIsRejeitado(item));
  const hasPendentes = items.some(item => String(item.estado_validacao || '').toUpperCase() === 'PENDENTE' && !isEwpCreated(item.criado_ewp));

  const filters: { label: string; value: FilterType }[] = [
    { label: 'Todos', value: 'ALL' },
    ...(hasPendentes ? [{ label: 'Pendente', value: 'PENDENTE' as FilterType }] : []),
    { label: 'Ativo', value: 'ATIVO' },
    ...(hasRejeitados ? [{ label: 'Rejeitado', value: 'REJEITADO' as FilterType }] : []),
  ];

  const uniqueById = (data: any[]) => {
    const map = new Map();
    data.forEach((item) => {
      if (item?.id) map.set(item.id, item);
    });
    return Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
  };

  const getFallbackParceiros = async () => {
    const grouped = await getParceirosGroupedDetailed();

    if (userRole === 'user') {
      return uniqueById([
        ...(grouped.users || []).flatMap((group: any) => group.parceiros || []),
        ...(grouped.tvrs || []).flatMap((group: any) => group.parceiros || []),
        ...(grouped.angariadores || []).flatMap((group: any) => group.parceiros || []),
      ]);
    }

    if (userRole === 'tvr') {
      const meusAngariadores = await listMyAngariadores();
      const meusAngariadoresIds = new Set(meusAngariadores.map((ang: any) => Number(ang.id)));
      const meusParceirosDiretos = (grouped.tvrs || [])
        .filter((group: any) => Number(group.id) === Number(userData?.id))
        .flatMap((group: any) => group.parceiros || []);
      const parceirosDosMeusAngariadores = (grouped.angariadores || [])
        .filter((group: any) => meusAngariadoresIds.has(Number(group.id)))
        .flatMap((group: any) => group.parceiros || []);

      return uniqueById([...meusParceirosDiretos, ...parceirosDosMeusAngariadores]);
    }

    if (userRole === 'angariador') {
      return uniqueById(
        (grouped.angariadores || [])
          .filter((group: any) => Number(group.id) === Number(userData?.id))
          .flatMap((group: any) => group.parceiros || [])
      );
    }

    return [];
  };

  const fetchData = async () => {
    try {
      setError('');
      const data = await listParceiros();
      if (data.length > 0) {
        setItems(data);
        return;
      }

      const fallbackData = await getFallbackParceiros();
      setItems(fallbackData);
    } catch (e: any) {
      try {
        const fallbackData = await getFallbackParceiros();
        setItems(fallbackData);
        setError('');
      } catch {
        setItems([]);
        setError(e?.response?.data?.msg || 'Não foi possível carregar a lista de parceiros.');
      }
    }
  };

  useEffect(() => {
    Promise.all([
      fetchData(),
      fetchAllPeople()
    ]).finally(() => setLoading(false));
  }, []);

  
  const openDetailsModal = async (item: any) => {
    setSelectedParceiro(item);
    setModalVisible(true);
    setLoadingDetails(true);
    try {
      const detailed = await getParceiro(item.id);
      if (detailed) {
        setSelectedParceiro(detailed);
      }
    } catch (e) {
      // Failed to load details
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditClick = () => {
    setModalVisible(false);
    navigation.navigate('CommercialDataForm', { editParceiroId: selectedParceiro.id });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>A carregar parceiros...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[Theme.colors.primary, Theme.colors.secondary]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn} activeOpacity={0.75} disabled={refreshing}>
            <Ionicons name="refresh" size={21} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Parceiros</Text>
        <Text style={styles.headerSubtitle}>{items.length} parceiro(s) registado(s)</Text>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal style={styles.filterScroll} showsHorizontalScrollIndicator={false}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
              onPress={() => setFilter(f.value)}
            >
              <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => {
          const statusTone = partnerStatusTone(item);
          const ewpCreated = isEwpCreated(item.criado_ewp);

          return (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.8} onPress={() => openDetailsModal(item)}>
            <View style={styles.iconWrap}>
              <Ionicons name="business-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.designacao || item.nomeComercial || `Parceiro #${item.id}`}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, styles[`status_${statusTone}`]]}>
                  <Text style={[styles.statusText, styles[`statusText_${statusTone}`]]}>
                    {partnerStatusLabel(item)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, ewpCreated ? styles.status_success : styles.status_muted]}>
                  <Text style={[styles.statusText, ewpCreated ? styles.statusText_success : styles.statusText_muted]}>
                    {ewpCreated ? 'EWP criado' : 'EWP pendente'}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>{item.tipo_parceiro || 'Parceiro'}{item.tipo_empresa ? ` · ${item.tipo_empresa}` : ''}</Text>
              {!!item.nuit && <Text style={styles.detail}>NUIT: {item.nuit}</Text>}
              {!!item.contacto_agente && <Text style={styles.detail}>Contacto: {item.contacto_agente}</Text>}
              {!!item.angariador_nome && (
                <View style={styles.creatorBox}>
                  <Ionicons name="person-circle-outline" size={15} color={Theme.colors.primary} />
                  <Text style={styles.creatorText}>
                    Cadastrado por {creatorTypeLabel(item.angariador_type)}: {item.angariador_nome}
                  </Text>
                </View>
              )}
              {!!item.angariador_msisdn && (
                <Text style={styles.creatorContact}>Contacto do cadastrador: {item.angariador_msisdn}</Text>
              )}
            </View>
            </TouchableOpacity>
          );
        })}

        {!!error && (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={34} color={Theme.colors.error} />
            <Text style={styles.errorTitle}>Falha ao carregar</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredItems.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={42} color={Theme.colors.border} />
            <Text style={styles.emptyTitle}>Sem parceiros</Text>
            <Text style={styles.emptySubtitle}>Ainda não existem parceiros para listar.</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Parceiro</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>A carregar detalhes...</Text>
              </View>
            ) : selectedParceiro ? (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Informações Básicas</Text>
                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Designação:</Text> {selectedParceiro.designacao}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Tipo:</Text> {selectedParceiro.tipo_parceiro}
                  </Text>
                  {selectedParceiro.tipo_empresa && (
                    <Text style={styles.modalText}>
                      <Text style={styles.modalLabel}>Tipo de Empresa:</Text> {selectedParceiro.tipo_empresa}
                    </Text>
                  )}
                  {selectedParceiro.nuit && (
                    <Text style={styles.modalText}>
                      <Text style={styles.modalLabel}>NUIT:</Text> {selectedParceiro.nuit}
                    </Text>
                  )}
                  {selectedParceiro.contacto_agente && (
                    <Text style={styles.modalText}>
                      <Text style={styles.modalLabel}>Contacto:</Text> {selectedParceiro.contacto_agente}
                    </Text>
                  )}
                  <View style={[styles.badgeRow, { marginTop: 12 }]}>
                    <View style={[styles.statusBadge, styles[`status_${partnerStatusTone(selectedParceiro)}`]]}>
                      <Text style={[styles.statusText, styles[`statusText_${partnerStatusTone(selectedParceiro)}`]]}>
                        {partnerStatusLabel(selectedParceiro)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, isEwpCreated(selectedParceiro.criado_ewp) ? styles.status_success : styles.status_muted]}>
                      <Text style={[styles.statusText, isEwpCreated(selectedParceiro.criado_ewp) ? styles.statusText_success : styles.statusText_muted]}>
                        {isEwpCreated(selectedParceiro.criado_ewp) ? 'EWP criado' : 'EWP pendente'}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedParceiro.comentarios && selectedParceiro.comentarios.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Comentários</Text>
                    {selectedParceiro.comentarios.map((comentario: any, index: number) => (
                      <View key={index} style={styles.commentBox}>
                        <Text style={styles.commentAuthor}>
                          {getAuthorName(comentario.user_id)} • {new Date(comentario.data_criacao).toLocaleString('pt-MZ')}
                        </Text>
                        <Text style={styles.commentText}>{comentario.texto || comentario.comentario}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Edit button for rejected partners: only creator OR admin OR (any user in pilot) */}
                {partnerIsRejeitado(selectedParceiro) && (
                  userIsCreator(selectedParceiro, userRole, userData) ||
                  userRole === 'admin' ||
                  (userData?.roles && Array.isArray(userData.roles) && userData.roles.includes('Admin')) ||
                  (Constants.expoConfig?.extra?.isPilot)
                ) && (
                  <TouchableOpacity style={styles.editBtn} onPress={handleEditClick}>
                    <Text style={styles.editBtnText}>Editar Parceiro</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.background, gap: 12 },
  loadingText: { color: Theme.colors.textSecondary, fontSize: 14 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 28, color: 'white', fontWeight: '800' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  scroll: { flex: 1, marginTop: -14 },
  content: { padding: 16, paddingTop: 24, paddingBottom: 48 },
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Theme.colors.border, elevation: 2 },
  iconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: `${Theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: Theme.colors.textPrimary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  status_success: { backgroundColor: `${Theme.colors.success}14` },
  status_warning: { backgroundColor: '#fff7d6' },
  status_danger: { backgroundColor: '#ffebee' },
  status_muted: { backgroundColor: Theme.colors.gray100 },
  statusText_success: { color: Theme.colors.success },
  statusText_warning: { color: '#a46a00' },
  statusText_danger: { color: Theme.colors.error },
  statusText_muted: { color: Theme.colors.textSecondary },
  meta: { fontSize: 12, color: Theme.colors.primary, fontWeight: '700', marginTop: 3 },
  detail: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 3 },
  creatorBox: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  creatorText: { flex: 1, fontSize: 12, color: Theme.colors.textPrimary, fontWeight: '600', lineHeight: 17 },
  creatorContact: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 3 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 17, color: Theme.colors.textPrimary, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 6 },
  filterContainer: { backgroundColor: Theme.colors.background, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterTabActive: { backgroundColor: Theme.colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary },
  filterTextActive: { color: 'white' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalScroll: { paddingBottom: 20 },
  modalSection: { marginBottom: 20 },
  modalSectionTitle: { fontSize: 15, fontWeight: '700', color: Theme.colors.primary, marginBottom: 8 },
  modalText: { fontSize: 14, color: Theme.colors.textPrimary, marginBottom: 4, lineHeight: 20 },
  modalLabel: { fontWeight: '600' },
  commentBox: { backgroundColor: Theme.colors.background, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: Theme.colors.border },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary, marginBottom: 4 },
  commentText: { fontSize: 14, color: Theme.colors.textPrimary, lineHeight: 20 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 10 },
  editBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  errorState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  errorTitle: { fontSize: 17, color: Theme.colors.error, fontWeight: '700', marginTop: 12 },
  errorSubtitle: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  retryBtn: { marginTop: 16, backgroundColor: Theme.colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  retryText: { color: 'white', fontWeight: '700', fontSize: 13 },
});
