import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { Theme } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';

const OtaUpdateGate = () => {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const applyAvailableUpdate = async () => {
      if (__DEV__ || !Updates.isEnabled) return;

      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;

        setUpdating(true);
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch (error) {
        console.log('OTA update check failed', error);
        setUpdating(false);
      }
    };

    applyAvailableUpdate();
  }, []);

  return (
    <Modal visible={updating} transparent animationType="fade">
      <View style={styles.updateBackdrop}>
        <View style={styles.updateCard}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.updateTitle}>A atualizar app...</Text>
          <Text style={styles.updateText}>A preparar a versão mais recente.</Text>
        </View>
      </View>
    </Modal>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.background} />
          <OtaUpdateGate />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  updateBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 24,
  },
  updateCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 24,
  },
  updateTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  updateText: {
    marginTop: 6,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
});

