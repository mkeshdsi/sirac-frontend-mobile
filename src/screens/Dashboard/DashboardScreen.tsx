import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const DashboardScreen = ({ navigation }: any) => {
  const { userRole, userData } = useAuth();

  const handleAction = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {userData?.nome || userData?.name || 'Utilizador'}</Text>
        <Text style={styles.role}>
          {userRole === 'tvr' ? 'Técnico de Vendas' : userRole === 'angariador' ? 'Angariador' : 'Administrador'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Ações Rápidas</Text>
      <View style={styles.actionsGrid}>
        
        {/* TODOS PODEM CADASTRAR PARCEIRO */}
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => handleAction('CommercialDataForm')}
        >
          <LinearGradient colors={[Theme.colors.primary, '#3B82F6']} style={styles.cardGradient}>
            <Ionicons name="business" size={32} color="white" />
            <Text style={styles.cardTitle}>Cadastrar{'\n'}Parceiro</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* APENAS ADMIN E TVR PODEM CADASTRAR ANGARIADOR */}
        {(userRole === 'user' || userRole === 'tvr') && (
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => handleAction('AngariadorDataForm')}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.cardGradient}>
              <Ionicons name="person-add" size={32} color="white" />
              <Text style={styles.cardTitle}>Cadastrar{'\n'}Angariador</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* APENAS ADMIN PODE VER O RELATORIO DE ANGARIADORES AGRUPADOS */}
        {userRole === 'user' && (
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => handleAction('AngariadoresList')} /* Tab na Navegação Secundária ou MainStack */
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.cardGradient}>
              <Ionicons name="people" size={32} color="white" />
              <Text style={styles.cardTitle}>Lista de{'\n'}Angariadores</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
  },
  header: {
    marginBottom: Theme.spacing.xl,
  },
  greeting: {
    ...Theme.typography.h1,
    color: Theme.colors.textPrimary,
  },
  role: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: Theme.spacing.xs,
  },
  sectionTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    padding: Theme.spacing.md,
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Theme.typography.h4,
    color: 'white',
    fontWeight: 'bold',
  },
});
