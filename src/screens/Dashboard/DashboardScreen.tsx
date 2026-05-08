import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ── Animated card component ──────────────────────────────
const ActionCard = ({ colors, icon, title, onPress, delay = 0 }: {
  colors: readonly [string, string, ...string[]];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  delay?: number;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View style={[styles.actionCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{ flex: 1 }}
      >
        <LinearGradient colors={colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Decorative circle */}
          <View style={styles.cardDecorCircle} />

          <View style={styles.cardIconWrap}>
            <Ionicons name={icon} size={26} color="rgba(255,255,255,0.95)" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main screen ──────────────────────────────────────────
export const DashboardScreen = ({ navigation }: any) => {
  const { userRole, userData } = useAuth();

  const getRoleLabel = () => {
    if (userRole === 'tvr') return 'Técnico de Vendas';
    if (userRole === 'angariador') return 'Angariador';
    return 'Administrador';
  };

  const getRoleIcon = (): keyof typeof Ionicons.glyphMap => {
    if (userRole === 'tvr') return 'briefcase';
    if (userRole === 'angariador') return 'person';
    return 'shield-checkmark';
  };

  const firstName = (userData?.nome || userData?.name || 'Utilizador').split(' ')[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          {/* Decorative elements */}
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />

          <View style={styles.headerTop}>
            <View style={styles.rolePill}>
              <Ionicons name={getRoleIcon()} size={12} color="rgba(255,255,255,0.9)" style={{ marginRight: 5 }} />
              <Text style={styles.rolePillText}>{getRoleLabel()}</Text>
            </View>
            
          </View>

          <Text style={styles.greetingSmall}>Bem‑vindo,</Text>
          <Text style={styles.greetingName}>{firstName} 👋</Text>

          <View style={styles.headerDivider} />

          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>
                {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Section title ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* ── Actions grid ── */}
        <View style={styles.actionsGrid}>

          {/* TODOS: Cadastrar Parceiro */}
          <ActionCard
            colors={[Theme.colors.primary, '#3B82F6']}
            icon="business-outline"
            title={`Cadastrar\nParceiro`}
            onPress={() => navigation.navigate('CommercialDataForm')}
          />

          {(userRole === 'user' || userRole === 'tvr' || userRole === 'angariador') && (
            <ActionCard
              colors={['#0EA5E9', '#0284C7']}
              icon="list-outline"
              title={`Lista de\nParceiros`}
              onPress={() => navigation.navigate('ParceirosList')}
            />
          )}

          {/* ADMIN + TVR: Cadastrar Angariador */}
          {(userRole === 'user' || userRole === 'tvr') && (
            <ActionCard
              colors={['#10B981', '#059669']}
              icon="person-add-outline"
              title={`Cadastrar\nAngariador`}
              onPress={() => navigation.navigate('AngariadorDataForm')}
            />
          )}

          {/* ADMIN + TVR: Lista de Angariadores */}
          {(userRole === 'user' || userRole === 'tvr') && (
            <ActionCard
              colors={['#F59E0B', '#D97706']}
              icon="people-outline"
              title={`Lista de\nAngariadores`}
              onPress={() => navigation.navigate('AngariadoresList')}
            />
          )}

          {/* ADMIN: Lista de TVRs */}
          {userRole === 'user' && (
            <ActionCard
              colors={['#6366F1', '#4F46E5']}
              icon="briefcase-outline"
              title={`Lista de\nTVRs`}
              onPress={() => navigation.navigate('TvrsList')}
            />
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    paddingBottom: 48,
  },

  // ── Header card ─────────────────────────────────────────
  headerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -80,
    right: -60,
  },
  headerDecor2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rolePillText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingSmall: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 16,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // ── Section header ───────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
    opacity: 0.6,
  },

  // ── Actions grid ─────────────────────────────────────────
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: '47.5%',
    aspectRatio: 1,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardGradient: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardDecorCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -30,
    right: -30,
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
