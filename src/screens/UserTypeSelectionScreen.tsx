import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import { Button } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, UserType } from '@/types';

const { width } = Dimensions.get('window');

type Nav = StackNavigationProp<RootStackParamList, 'UserTypeSelection'>;

interface Props { 
  navigation: Nav;
}

interface UserTypeOption {
  type: UserType;
  title: string;
  description: string;
  icon: string;
  features: string[];
  gradient: readonly [string, string];
}

const userTypeOptions: UserTypeOption[] = [
  {
    type: 'Comerciante',
    title: 'Comerciante',
    description: 'Será registado como MERCHANT',
    icon: '🏪',
    features: [
      'Abertura de Parceiro (MERCHANT)',
    
    ],
    gradient: ['#F2C94C', '#00A3E0'] as const
  },
  {
    type: 'TecnicoComercial',
    title: 'Técnico Comercial',
    description: 'Será registado como AGENTE',
    icon: '👨‍💼',
    features: [
      'Abertura de Parceiro (AGENTE)',
      
    ],
    gradient: ['#F2C94C', '#0077B6'] as const
  }
];

export const UserTypeSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const SELECTED_BG = '#01836b'; 
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  const handleSelection = (userType: UserType) => {
    setSelectedType(userType);
  };

  const handleContinue = () => {
    if (selectedType) {
      navigation.navigate('CommercialDataForm');
    }
  };

  const handleLogout = () => {
    // Limpa a navegação e volta ao Login
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderUserTypeCard = (option: UserTypeOption) => {
    const isSelected = selectedType === option.type;
    
    return (
      <TouchableOpacity
        key={option.type}
        style={[
          styles.userTypeCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => handleSelection(option.type)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isSelected ? ([SELECTED_BG, SELECTED_BG] as const) : (['#FFFFFF', '#F8F9FA'] as const)}
          style={styles.cardGradient}
        >
          {/* Selection Indicator */}
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.radioButton,
              isSelected && styles.radioButtonSelected
            ]}>
              {isSelected && <View style={styles.radioButtonInner} />}
            </View>
          </View>

          {/* Icon */}
          <View style={[
            styles.iconContainer,
            isSelected && styles.selectedIconContainer
          ]}>
            {option.type === 'TecnicoComercial' ? (
              <Image source={require('../../logo_png.png')} style={styles.logoIcon} resizeMode="contain" />
            ) : (
              <Text style={styles.cardIcon}>{option.icon}</Text>
            )}
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={[
              styles.cardTitle,
              isSelected && styles.selectedCardTitle
            ]}>
              {option.title}
            </Text>
            
            <Text style={[
              styles.cardDescription,
              isSelected && styles.selectedCardDescription
            ]}>
              {option.description}
            </Text>

            {/* Features List */}
            <View style={styles.featuresList}>
              {option.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[
                    styles.featureBullet,
                    isSelected && styles.selectedFeatureBullet
                  ]} />
                  <Text style={[
                    styles.featureText,
                    isSelected && styles.selectedFeatureText
                  ]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Selected Badge */}
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓ Selecionado</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.secondary + '08', Theme.colors.background] as const}
        style={styles.backgroundGradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.8}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressIndicator}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '33%' }]} />
              </View>
              <Text style={styles.progressText}>Passo 1 de 3</Text>
            </View>

            <Text style={styles.title}>Selecione o seu perfil</Text>
            <Text style={styles.subtitle}>
              Escolha como pretende fazer o cadastro no sistema SIRAC
            </Text>
          </View>

          {/* User Type Cards */}
          <View style={styles.cardsContainer}>
            {userTypeOptions.map(renderUserTypeCard)}
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Precisa de ajuda?</Text>
            <Text style={styles.helpText}>
              Se não tem certeza sobre qual perfil escolher, entre em contacto connosco.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action */}
        <View style={styles.bottomAction}>
          <Button 
            title="Continuar" 
            onPress={handleContinue}
            disabled={!selectedType}
            style={selectedType ? styles.continueButton : StyleSheet.flatten([styles.continueButton, styles.disabledButton])}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 100, // Space for fixed button
  },

  // Header Styles
  header: {
    marginBottom: Theme.spacing.xxl,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Theme.spacing.md,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  logoutText: {
    ...Theme.typography.caption,
    color: Theme.colors.error,
    fontWeight: '700',
  },
  progressIndicator: {
    marginBottom: Theme.spacing.xl,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Theme.colors.surface,
    borderRadius: 2,
    marginBottom: Theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  title: {
    ...Theme.typography.h2,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Cards Container
  cardsContainer: {
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },

  // User Type Card Styles
  userTypeCard: {
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    ...Theme.shadow.medium,
  },
  selectedCard: {
    ...Theme.shadow.large,
  },
  cardGradient: {
    padding: Theme.spacing.xl,
    minHeight: 200,
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: Theme.spacing.lg,
    right: Theme.spacing.lg,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Theme.colors.textSecondary + '40',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Theme.colors.surface,
    backgroundColor: Theme.colors.surface,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.primary,
  },

  // Icon and Content
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  selectedIconContainer: {
    backgroundColor: Theme.colors.surface + '30',
  },
  cardIcon: {
    fontSize: 28,
  },
  logoIcon: {
    width: 36,
    height: 36,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: Theme.spacing.sm,
  },
  selectedCardTitle: {
    color: '#FFFFFF',
  },
  cardDescription: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.lg,
  },
  selectedCardDescription: {
    color: '#FFFFFF',
  },

  // Features List
  featuresList: {
    gap: Theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.accent,
    marginRight: Theme.spacing.sm,
    marginTop: 8,
  },
  selectedFeatureBullet: {
    backgroundColor: Theme.colors.surface,
  },
  featureText: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  selectedFeatureText: {
    color: '#FFFFFF',
  },

  // Selected Badge
  selectedBadge: {
    position: 'absolute',
    bottom: Theme.spacing.lg,
    right: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  selectedBadgeText: {
    ...Theme.typography.caption,
    color: Theme.colors.primary,
    fontWeight: '600',
  },

  // Help Section
  helpSection: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadow.small,
  },
  helpTitle: {
    ...Theme.typography.body1,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  helpText: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    ...Theme.shadow.medium,
  },
  continueButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.lg,
    paddingVertical: Theme.spacing.lg,
  },
  disabledButton: {
    backgroundColor: Theme.colors.textSecondary + '40',
  },
});