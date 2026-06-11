import React, { useCallback, useState } from 'react';
import { ActivityIndicator, DimensionValue, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '@/constants/theme';
import { DashboardOverview, getDashboardOverview } from '@/services/apiResources';

const StatCard = ({ label, value, icon, tone = 'primary', width }: {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'blue' | 'amber' | 'green';
  width: DimensionValue;
}) => {
  const colors = {
    primary: { bg: '#01836b12', icon: Theme.colors.primary },
    blue: { bg: '#2563eb12', icon: '#2563eb' },
    amber: { bg: '#f59e0b14', icon: '#d97706' },
    green: { bg: '#16a34a12', icon: '#16a34a' },
  }[tone];

  return (
    <View style={[styles.statCard, { width }]}>
      <View style={[styles.statIcon, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={18} color={colors.icon} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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

const RankingList = ({ title, items, emptyText }: {
  title: string;
  items: Array<{ id: number; nome: string; total: number }>;
  emptyText: string;
}) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.rankRow}>
            <View style={styles.rankIndex}><Text style={styles.rankIndexText}>{index + 1}</Text></View>
            <Text style={styles.rankName} numberOfLines={1}>{item.nome}</Text>
            <Text style={styles.rankTotal}>{item.total}</Text>
          </View>
        ))}
    </View>
  );
};

export const OverviewScreen = () => {
  const { width } = useWindowDimensions();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Não foi possível carregar a visão geral.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const scopeLabel = overview?.scope === 'user'
    ? 'Geral'
    : overview?.scope === 'tvr'
      ? 'Equipa TVR'
      : 'Individual';
  const horizontalPadding = 32;
  const cardGap = 10;
  const availableWidth = Math.max(width - horizontalPadding, 280);
  const useSingleColumnStats = availableWidth < 360;
  const statCardWidth = useSingleColumnStats ? '100%' : Math.floor((availableWidth - cardGap) / 2);
  const stats = overview ? [
    { label: 'Parceiros', value: overview.totals.parceiros, icon: 'business-outline' as const, tone: 'primary' as const, visible: true },
    { label: 'Este mês', value: overview.totals.parceiros_mes, icon: 'calendar-outline' as const, tone: 'green' as const, visible: true },
    { label: 'Angariadores', value: overview.totals.angariadores, icon: 'people-outline' as const, tone: 'blue' as const, visible: overview.scope !== 'angariador' || overview.totals.angariadores > 0 },
    { label: 'TVRs', value: overview.totals.tvrs, icon: 'briefcase-outline' as const, tone: 'amber' as const, visible: overview.totals.tvrs > 0 },
  ].filter((item) => item.visible) : [];

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>A carregar visão geral...</Text>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>{scopeLabel}</Text>
            <Text style={styles.title}>Visão geral</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => load(true)} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {overview && (
          <>
            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <StatCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  tone={item.tone}
                  width={statCardWidth}
                />
              ))}
            </View>

            <View style={styles.progressBand}>
              <View>
                <Text style={styles.progressLabel}>Evolução mensal</Text>
                <Text style={styles.progressValue}>{overview.progress.growth_percent}%</Text>
              </View>
              <Text style={styles.progressCopy}>
                {overview.progress.month_total} este mês contra {overview.progress.previous_month_total} no mês anterior
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Últimos 7 dias</Text>
              <BarChart data={overview.series} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Origem dos cadastros</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>Direto TVR</Text>
                <Text style={styles.breakdownValue}>{overview.breakdown.diretos_tvr}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>Angariadores</Text>
                <Text style={styles.breakdownValue}>{overview.breakdown.por_angariadores}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>Utilizadores</Text>
                <Text style={styles.breakdownValue}>{overview.breakdown.por_users}</Text>
              </View>
            </View>

            <RankingList title="Top angariadores" items={overview.top_angariadores} emptyText="Ainda não há cadastros por angariadores." />
            {overview.scope === 'user' && (
              <RankingList title="Top TVRs" items={overview.top_tvrs} emptyText="Ainda não há cadastros diretos por TVRs." />
            )}

            {overview.recent_parceiros.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parceiros recentes</Text>
                {overview.recent_parceiros.map((item) => (
                  <View key={item.id} style={styles.recentRow}>
                    <View style={styles.recentIcon}>
                      <Ionicons name="business-outline" size={16} color={Theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentTitle} numberOfLines={1}>{item.designacao}</Text>
                      <Text style={styles.recentMeta}>{item.tipo_parceiro} · {item.data_adesao || 'Sem data'}</Text>
                    </View>
                  </View>
                ))}
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
  kicker: { fontSize: 12, color: Theme.colors.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Theme.colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { flex: 1, color: Theme.colors.error, fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 12 },
  statCard: { minHeight: 132, backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Theme.colors.border },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary },
  statLabel: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600', marginTop: 2 },
  progressBand: { backgroundColor: Theme.colors.primary, borderRadius: 12, padding: 16, marginBottom: 12 },
  progressLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  progressValue: { color: 'white', fontSize: 28, fontWeight: '900', marginTop: 2 },
  progressCopy: { color: 'rgba(255,255,255,0.86)', fontSize: 13, marginTop: 8, lineHeight: 18 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 130 },
  chartItem: { flex: 1, alignItems: 'center' },
  barTrack: { width: 18, height: 96, borderRadius: 9, backgroundColor: '#eef2f4', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: 18, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: Theme.colors.primary },
  barValue: { fontSize: 11, color: Theme.colors.textPrimary, fontWeight: '700', marginTop: 6 },
  barLabel: { fontSize: 10, color: Theme.colors.textSecondary, marginTop: 2 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  breakdownText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  breakdownValue: { color: Theme.colors.textPrimary, fontWeight: '800' },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10 },
  rankIndex: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#eef8f5', alignItems: 'center', justifyContent: 'center' },
  rankIndexText: { color: Theme.colors.primary, fontWeight: '800', fontSize: 12 },
  rankName: { flex: 1, color: Theme.colors.textPrimary, fontWeight: '700' },
  rankTotal: { color: Theme.colors.primary, fontWeight: '900' },
  emptyText: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 18 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  recentIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#eef8f5', alignItems: 'center', justifyContent: 'center' },
  recentTitle: { color: Theme.colors.textPrimary, fontWeight: '800' },
  recentMeta: { color: Theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
});
