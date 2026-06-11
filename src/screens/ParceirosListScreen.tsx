import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getParceirosGroupedDetailed, listMyAngariadores, listParceiros } from '@/services/apiResources';

export const ParceirosListScreen = ({ navigation }: any) => {
  const { userRole, userData } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
      return uniqueById((grouped.angariadores || [])
        .filter((group: any) => Number(group.id) === Number(userData?.id))
        .flatMap((group: any) => group.parceiros || []));
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
    fetchData().finally(() => setLoading(false));
  }, []);

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="business-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.designacao || item.nomeComercial || `Parceiro #${item.id}`}</Text>
              <Text style={styles.meta}>{item.tipo_parceiro || 'Parceiro'}{item.tipo_empresa ? ` · ${item.tipo_empresa}` : ''}</Text>
              {!!item.nuit && <Text style={styles.detail}>NUIT: {item.nuit}</Text>}
              {!!item.contacto_agente && <Text style={styles.detail}>Contacto: {item.contacto_agente}</Text>}
            </View>
          </View>
        ))}

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

        {items.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={42} color={Theme.colors.border} />
            <Text style={styles.emptyTitle}>Sem parceiros</Text>
            <Text style={styles.emptySubtitle}>Ainda não existem parceiros para listar.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  meta: { fontSize: 12, color: Theme.colors.primary, fontWeight: '700', marginTop: 3 },
  detail: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 3 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 17, color: Theme.colors.textPrimary, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 6 },
  errorState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  errorTitle: { fontSize: 17, color: Theme.colors.error, fontWeight: '700', marginTop: 12 },
  errorSubtitle: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  retryBtn: { marginTop: 16, backgroundColor: Theme.colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  retryText: { color: 'white', fontWeight: '700', fontSize: 13 },
});
