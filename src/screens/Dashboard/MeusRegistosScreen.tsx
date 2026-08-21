import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Theme } from '@/constants/theme';
import { MeusRegistosData, getMeusRegistos } from '@/services/apiResources';

const ITEMS_PER_PAGE = 6;

type FilterType = 'todos' | 'parceiros' | 'angariadores' | 'tvrs';

const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'todos', label: 'Todos', icon: 'layers-outline', color: Theme.colors.primary },
  { key: 'parceiros', label: 'Parceiros', icon: 'business-outline', color: '#2563eb' },
  { key: 'angariadores', label: 'Angariadores', icon: 'people-outline', color: '#16a34a' },
  { key: 'tvrs', label: 'TVRs', icon: 'briefcase-outline', color: '#d97706' },
];

const MonthlyCard = ({ item, index }: { item: { label: string; parceiros: number; angariadores: number; tvrs: number }; index: number }) => {
  const total = item.parceiros + item.angariadores + item.tvrs;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIndex}>
          <Text style={styles.cardIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.cardMonthWrap}>
          <Ionicons name="calendar-outline" size={14} color={Theme.colors.primary} />
          <Text style={styles.cardMonth}>{item.label}</Text>
        </View>
        <View style={styles.cardTotalBadge}>
          <Text style={styles.cardTotalText}>{total}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardStat}>
          <View style={[styles.cardStatDot, { backgroundColor: '#2563eb' }]} />
          <Text style={styles.cardStatLabel}>Parceiros</Text>
          <Text style={styles.cardStatValue}>{item.parceiros}</Text>
        </View>
        <View style={styles.cardStat}>
          <View style={[styles.cardStatDot, { backgroundColor: '#16a34a' }]} />
          <Text style={styles.cardStatLabel}>Angariadores</Text>
          <Text style={styles.cardStatValue}>{item.angariadores}</Text>
        </View>
        <View style={styles.cardStat}>
          <View style={[styles.cardStatDot, { backgroundColor: '#d97706' }]} />
          <Text style={styles.cardStatLabel}>TVRs</Text>
          <Text style={styles.cardStatValue}>{item.tvrs}</Text>
        </View>
      </View>

      <View style={styles.cardBar}>
        {item.parceiros > 0 && <View style={[styles.cardBarSeg, { flex: item.parceiros, backgroundColor: '#2563eb' }]} />}
        {item.angariadores > 0 && <View style={[styles.cardBarSeg, { flex: item.angariadores, backgroundColor: '#16a34a' }]} />}
        {item.tvrs > 0 && <View style={[styles.cardBarSeg, { flex: item.tvrs, backgroundColor: '#d97706' }]} />}
      </View>
    </View>
  );
};

const BarChart = ({ data }: { data: Array<{ label: string; value: number }> }) => {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <View style={styles.chartRow}>
      {data.map((item) => {
        const height = 18 + (item.value / max) * 72;
        return (
          <View key={item.label} style={styles.chartItem}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height }]} />
            </View>
            <Text style={styles.barValue}>{item.value}</Text>
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

export const MeusRegistosScreen = ({ navigation }: any) => {
  const [data, setData] = useState<MeusRegistosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const result = await getMeusRegistos();
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Não foi possível carregar os seus registos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const monthlyData = useMemo(() => {
    if (!data) return [];
    const meses = data.ultimos_6_meses;
    const len = meses.parceiros.length;
    const result: Array<{ label: string; parceiros: number; angariadores: number; tvrs: number }> = [];
    for (let i = 0; i < len; i++) {
      result.push({
        label: meses.parceiros[i]?.label || meses.angariadores[i]?.label || meses.tvrs[i]?.label || '',
        parceiros: meses.parceiros[i]?.value || 0,
        angariadores: meses.angariadores[i]?.value || 0,
        tvrs: meses.tvrs[i]?.value || 0,
      });
    }
    return result;
  }, [data]);

  const filteredData = useMemo(() => {
    let result = monthlyData;
    if (selectedMonth) {
      result = result.filter((item) => item.label === selectedMonth);
    }
    if (activeFilter !== 'todos') {
      result = result.map((item) => ({
        ...item,
        parceiros: activeFilter === 'parceiros' ? item.parceiros : 0,
        angariadores: activeFilter === 'angariadores' ? item.angariadores : 0,
        tvrs: activeFilter === 'tvrs' ? item.tvrs : 0,
      }));
    }
    return result;
  }, [monthlyData, activeFilter, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const pagedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const availableMonths = useMemo(() => {
    if (!data) return [];
    const meses = data.ultimos_6_meses;
    const len = meses.parceiros.length;
    const months: string[] = [];
    for (let i = 0; i < len; i++) {
      const label = meses.parceiros[i]?.label || meses.angariadores[i]?.label || meses.tvrs[i]?.label;
      if (label) months.push(label);
    }
    return months;
  }, [data]);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>A carregar registos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.kicker}>Activations</Text>
            <Text style={styles.title}>Meus Registos</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {data && (
          <>
            {/* Summary banner */}
            <LinearGradient
              colors={[Theme.colors.primary, '#0EA5E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryBanner}
            >
              <View style={styles.summaryDecor} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{data.mes_atual.parceiros}</Text>
                  <Text style={styles.summaryLabel}>Parceiros</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{data.mes_atual.angariadores}</Text>
                  <Text style={styles.summaryLabel}>Angariadores</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{data.mes_atual.tvrs}</Text>
                  <Text style={styles.summaryLabel}>TVRs</Text>
                </View>
              </View>
              <Text style={styles.summaryFooter}>Total do mês actual</Text>
            </LinearGradient>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = activeFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => handleFilterChange(f.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={f.icon} size={14} color={active ? 'white' : f.color} />
                    <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Month picker */}
            <TouchableOpacity
              style={styles.monthPickerBtn}
              onPress={() => setShowMonthPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.monthPickerLabel}>
                {selectedMonth ? selectedMonth : 'Todos os meses'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Theme.colors.textSecondary} />
            </TouchableOpacity>

            {selectedMonth && (
              <TouchableOpacity
                style={styles.clearMonthBtn}
                onPress={() => { setSelectedMonth(null); setPage(1); }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={14} color={Theme.colors.error} />
                <Text style={styles.clearMonthText}>Limpar filtro de data</Text>
              </TouchableOpacity>
            )}

            {/* Month picker modal */}
            <Modal
              visible={showMonthPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowMonthPicker(false)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowMonthPicker(false)}
              >
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Escolher mês</Text>
                    <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                      <Ionicons name="close" size={22} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.monthOption, !selectedMonth && styles.monthOptionActive]}
                    onPress={() => { setSelectedMonth(null); setPage(1); setShowMonthPicker(false); }}
                  >
                    <Ionicons name="layers-outline" size={18} color={!selectedMonth ? 'white' : Theme.colors.primary} />
                    <Text style={[styles.monthOptionText, !selectedMonth && styles.monthOptionTextActive]}>
                      Todos os meses
                    </Text>
                  </TouchableOpacity>

                  {availableMonths.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthOption, selectedMonth === m && styles.monthOptionActive]}
                      onPress={() => { setSelectedMonth(m); setPage(1); setShowMonthPicker(false); }}
                    >
                      <Ionicons name="calendar-outline" size={18} color={selectedMonth === m ? 'white' : Theme.colors.primary} />
                      <Text style={[styles.monthOptionText, selectedMonth === m && styles.monthOptionTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Monthly list */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Registos mensais</Text>
              <Text style={styles.listCount}>{filteredData.length} meses</Text>
            </View>

            {pagedData.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={40} color={Theme.colors.textSecondary} />
                <Text style={styles.emptyText}>Sem registos para este filtro.</Text>
              </View>
            ) : (
              pagedData.map((item, idx) => (
                <MonthlyCard key={item.label} item={item} index={(page - 1) * ITEMS_PER_PAGE + idx} />
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Ionicons name="chevron-back" size={18} color={page === 1 ? '#ccc' : Theme.colors.primary} />
                </TouchableOpacity>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pageNum, p === page && styles.pageNumActive]}
                    onPress={() => setPage(p)}
                  >
                    <Text style={[styles.pageNumText, p === page && styles.pageNumTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <Ionicons name="chevron-forward" size={18} color={page === totalPages ? '#ccc' : Theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Daily chart */}
            {data.ultimos_7_dias.parceiros.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Últimos 7 dias — Parceiros</Text>
                <BarChart data={data.ultimos_7_dias.parceiros} />
              </View>
            )}

            {data.ultimos_7_dias.angariadores.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Últimos 7 dias — Angariadores</Text>
                <BarChart data={data.ultimos_7_dias.angariadores} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.background },
  loadingText: { marginTop: 12, color: Theme.colors.textSecondary, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  headerCenter: { alignItems: 'center' },
  kicker: { fontSize: 12, color: Theme.colors.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 2 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Theme.colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { flex: 1, color: Theme.colors.error, fontSize: 13, fontWeight: '600' },

  summaryBanner: { borderRadius: 16, padding: 20, marginBottom: 16, overflow: 'hidden' },
  summaryDecor: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -30 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: 'white', fontSize: 28, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  summaryFooter: { color: 'rgba(255,255,255,0.65)', fontSize: 11, textAlign: 'center', marginTop: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 0 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: Theme.colors.border },
  filterChipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  filterLabel: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  filterLabelActive: { color: 'white' },

  monthPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  monthPickerLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary },
  clearMonthBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  clearMonthText: { fontSize: 12, fontWeight: '600', color: Theme.colors.error },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 20, width: '100%', padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Theme.colors.textPrimary },
  monthOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6 },
  monthOptionActive: { backgroundColor: Theme.colors.primary },
  monthOptionText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  monthOptionTextActive: { color: 'white' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  listCount: { fontSize: 12, fontWeight: '600', color: Theme.colors.textSecondary },

  card: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 10, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 },
  cardIndex: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#eef8f5', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardIndexText: { color: Theme.colors.primary, fontWeight: '800', fontSize: 12 },
  cardMonthWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMonth: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  cardTotalBadge: { backgroundColor: Theme.colors.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  cardTotalText: { color: 'white', fontWeight: '800', fontSize: 13 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 10 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  cardStatDot: { width: 8, height: 8, borderRadius: 4 },
  cardStatLabel: { flex: 1, fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '600' },
  cardStatValue: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  cardBar: { flexDirection: 'row', height: 4, marginHorizontal: 14, marginBottom: 14, borderRadius: 2, overflow: 'hidden', backgroundColor: '#eef2f4' },
  cardBarSeg: { minWidth: 2 },

  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16 },
  pageBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled: { backgroundColor: '#f5f5f5' },
  pageNum: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  pageNumActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  pageNumText: { fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary },
  pageNumTextActive: { color: 'white' },

  section: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 130 },
  chartItem: { flex: 1, alignItems: 'center' },
  barTrack: { width: 18, height: 96, borderRadius: 9, backgroundColor: '#eef2f4', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: 18, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: Theme.colors.primary },
  barValue: { fontSize: 11, color: Theme.colors.textPrimary, fontWeight: '700', marginTop: 6 },
  barLabel: { fontSize: 10, color: Theme.colors.textSecondary, marginTop: 2 },
});
