import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { getAngariadoresGrouped } from '@/services/apiResources';
import { LinearGradient } from 'expo-linear-gradient';

export const AngariadoresListScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSections, setActiveSections] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getAngariadoresGrouped();
    if (res && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  const toggleSection = (id: number) => {
    if (activeSections.includes(id)) {
      setActiveSections(activeSections.filter(i => i !== id));
    } else {
      setActiveSections([...activeSections, id]);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Theme.colors.primary, Theme.colors.secondary]} style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Angariadores</Text>
        </View>
        <Text style={styles.headerSubtitle}>Listagem agrupada por Técnico de Venda</Text>
      </LinearGradient>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {data.map((item, index) => {
          const isExpanded = activeSections.includes(item.tvr_id);
          const tvrName = item.tvr_nome || (item.tvr_id === 0 ? 'Sem TVR (Admins)' : 'Desconhecido');
          
          return (
            <View key={index} style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => toggleSection(item.tvr_id)}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="briefcase" size={20} color="white" />
                  </View>
                  <View>
                    <Text style={styles.tvrName}>{tvrName}</Text>
                    <Text style={styles.totalBadge}>{item.total_angariadores} Angariador(es)</Text>
                  </View>
                </View>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={Theme.colors.textSecondary} />
              </TouchableOpacity>

              <Collapsible collapsed={!isExpanded}>
                <View style={styles.collapsibleContent}>
                  {item.angariadores.map((ang: any, idx: number) => (
                    <View key={idx} style={styles.angariadorRow}>
                      {ang.bi_frente ? (
                        <Image source={{ uri: ang.bi_frente }} style={styles.angariadorImg} />
                      ) : (
                        <View style={[styles.angariadorImg, styles.placeholderImg]}>
                          <Ionicons name="person" size={20} color={Theme.colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.angariadorInfo}>
                        <Text style={styles.angariadorName}>{ang.nome}</Text>
                        <Text style={styles.angariadorContact}>{ang.msisdn} | {ang.email}</Text>
                      </View>
                    </View>
                  ))}
                  {item.angariadores.length === 0 && (
                    <Text style={styles.emptyText}>Nenhum angariador encontrado.</Text>
                  )}
                </View>
              </Collapsible>
            </View>
          );
        })}
        {data.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Theme.colors.border} />
            <Text style={styles.emptyText}>Sem dados disponíveis</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { ...Theme.typography.h1, color: 'white' },
  headerSubtitle: { ...Theme.typography.body, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  listContainer: { flex: 1, marginTop: -20 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  tvrName: { ...Theme.typography.h4, color: Theme.colors.textPrimary },
  totalBadge: { ...Theme.typography.caption, color: Theme.colors.primary, marginTop: 2, fontWeight: 'bold' },
  collapsibleContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: Theme.colors.surface,
  },
  angariadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  angariadorImg: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  placeholderImg: { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  angariadorInfo: { flex: 1 },
  angariadorName: { ...Theme.typography.body, color: Theme.colors.textPrimary, fontWeight: '600' },
  angariadorContact: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { ...Theme.typography.body, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 16 },
});
