import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { Button } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

interface Props { 
  navigation: Nav;
}

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.primary + '15', Theme.colors.background]}
        style={styles.gradientBackground}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../logo.jpg')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>
            
            <View style={styles.titleSection}>
              <Text style={styles.title}>SIRAC</Text>
              <View style={styles.titleUnderline} />
              <Text style={styles.subtitle}>
                Sistema de Registo de{'\n'}Agentes e Comerciantes
              </Text>
            </View>
          </View>

          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.cardHeader}>
              <View style={styles.welcomeIconContainer}>
                <Text style={styles.welcomeIcon}>👋</Text>
              </View>
              <Text style={styles.cardTitle}>Bem-vindo ao SIRAC</Text>
            </View>
            
            <Text style={styles.cardDescription}>
              Simplifique o processo de registo e gestão de agentes e comerciantes. 
              Selecione o seu perfil para começar.
            </Text>

            {/* Features List */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>Registo rápido e seguro</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>Gestão de documentos</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>Acompanhamento em tempo real</Text>
              </View>
            </View>

            {/* Action Button */}
            <View style={styles.actionContainer}>
              <Button 
                title="Iniciar Cadastro" 
                onPress={() => navigation.navigate('UserTypeSelection')}
                style={styles.primaryButton}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Versão 1.0 • © 2025 SIRAC
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
  },
  
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  logoContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadow.medium,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleSection: {
    alignItems: 'center',
  },
  title: {
    ...Theme.typography.h1,
    fontSize: 42,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 2,
    marginBottom: Theme.spacing.xs,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: Theme.colors.accent,
    borderRadius: 2,
    marginBottom: Theme.spacing.md,
  },
  subtitle: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Welcome Card Styles
  welcomeCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.xxl,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadow.large,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '10',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  welcomeIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: Theme.colors.primary + '15',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  welcomeIcon: {
    fontSize: 28,
  },
  cardTitle: {
    ...Theme.typography.h2,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
  },
  cardDescription: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Theme.spacing.xl,
  },

  // Features List Styles
  featuresList: {
    marginBottom: Theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    paddingLeft: Theme.spacing.sm,
  },
  featureBullet: {
    width: 8,
    height: 8,
    backgroundColor: Theme.colors.accent,
    borderRadius: 4,
    marginRight: Theme.spacing.md,
  },
  featureText: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },

  // Action Button Styles
  actionContainer: {
    marginTop: Theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.lg,
    paddingVertical: Theme.spacing.lg,
    ...Theme.shadow.medium,
  },

  // Footer Styles
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: Theme.spacing.xl,
  },
  footerText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    opacity: 0.7,
  },
});