import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { Button, Card } from '@/components';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';

type Nav = StackNavigationProp<RootStackParamList, 'Success'>;
type Route = RouteProp<RootStackParamList, 'Success'>;

interface Props { navigation: Nav; route: Route }

const COLORS = {
  primary: '#01836b',
  secondary: '#ffcc03',
  primaryLight: '#01836b15',
  secondaryLight: '#ffcc0315',
  white: '#ffffff',
  background: '#f8f9fa',
  surface: '#ffffff',
  border: '#e0e0e0',
  text: '#1a1a1a',
  textSecondary: '#666666',
  success: '#01836b',
};

export const SuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { registrationId } = route.params;
  const insets = useSafeAreaInsets();

  // Animações
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    // Animação de entrada
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const nextSteps = [
    {
      icon: '🔍',
      title: 'Análise de Documentos',
      description: 'A nossa equipa irá validar os documentos submetidos',
    },
    {
      icon: '✅',
      title: 'Aprovação Final',
      description: 'Será notificado quando o cadastro for aprovado',
    },
    {
      icon: '🚀',
      title: 'Início de Operações',
      description: 'Poderá começar a operar após a aprovação',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon com animação */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successCircle}>
            <View style={styles.successCircleInner}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
          </View>
        </Animated.View>

        {/* Mensagem Principal com animação */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.title}>Cadastro Submetido!</Text>
          <Text style={styles.subtitle}>
            O seu pedido de cadastro foi enviado com sucesso e está a ser processado
          </Text>
        </Animated.View>

        {/* Card de Próximos Passos */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Card style={styles.stepsCard}>
            <View style={styles.stepsHeader}>
              <View style={styles.stepsIconContainer}>
                <Text style={styles.stepsHeaderIcon}>📋</Text>
              </View>
              <Text style={styles.stepsTitle}>Próximos Passos</Text>
            </View>

            <View style={styles.stepsList}>
              {nextSteps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepIconContainer}>
                    <Text style={styles.stepIcon}>{step.icon}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                  {index < nextSteps.length - 1 && (
                    <View style={styles.stepConnector} />
                  )}
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.contactCard}>
            <Text style={styles.contactTitle}>#SemStress</Text>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Footer com botão */}
      <View style={[
        styles.footer,
        { paddingBottom: Math.max(20, insets.bottom + 12) }
      ]}>
        <TouchableOpacity
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'CommercialDataForm' }],
            });
          }}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  successCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 56,
    color: COLORS.white,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  stepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepsHeaderIcon: {
    fontSize: 20,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepsList: {
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingBottom: 24,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    zIndex: 2,
  },
  stepIcon: {
    fontSize: 24,
  },
  stepContent: {
    flex: 1,
    paddingTop: 6,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  stepConnector: {
    position: 'absolute',
    left: 23,
    top: 48,
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
  },
  contactCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  contactTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});