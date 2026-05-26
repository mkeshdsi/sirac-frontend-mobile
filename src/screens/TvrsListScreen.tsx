import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { listTvrs } from '@/services/apiResources';

export const TvrsListScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          <View key={item.id} style={styles.card}>
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
          </View>
        ))}

        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={42} color={Theme.colors.border} />
            <Text style={styles.emptyTitle}>Sem TVRs</Text>
            <Text style={styles.emptySubtitle}>Ainda não existem TVRs para listar.</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, color: 'white', fontWeight: '800' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  scroll: { flex: 1, marginTop: -14 },
  content: { padding: 16, paddingTop: 24, paddingBottom: 48 },
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Theme.colors.border, elevation: 2 },
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
});
