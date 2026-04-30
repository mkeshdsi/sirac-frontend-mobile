import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/types';
import { Theme } from '@/constants/theme';

// Public Screens
import { LoginScreen } from '@/screens/LoginScreen';

// Private Screens (Dashboard & Flow)
import { DashboardTabs } from '@/navigation/DashboardTabs';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { PersonalDataFormScreen } from '@/screens/PersonalDataFormScreen';
import { CommercialDataFormScreen } from '@/screens/CommercialDataFormScreen';
import { DocumentUploadScreen } from '@/screens/DocumentUploadScreen';
import { ReviewSubmitScreen } from '@/screens/ReviewSubmitScreen';
import { SuccessScreen } from '@/screens/SuccessScreen';
import { PasswordCreationScreen } from '@/screens/PasswordCreationScreen';

import { AngariadorDataFormScreen } from '@/screens/Angariador/AngariadorDataFormScreen';
import { AngariadoresListScreen } from '@/screens/Angariador/AngariadoresListScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { userRole, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a splash screen component
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.textPrimary,
        headerTitleStyle: { ...Theme.typography.h4 },
        cardStyle: { backgroundColor: Theme.colors.background },
      }}
    >
      {!userRole ? (
        // Public Flow
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        // Private Flow
        <>
          <Stack.Screen name="Dashboard" component={DashboardTabs} options={{ headerShown: false, title: 'SIRAC' }} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: ' SIRAC' }} />
          <Stack.Screen name="PasswordCreation" component={PasswordCreationScreen} options={{ title: 'Palavra‑Passe' }} />
          <Stack.Screen name="PersonalDataForm" component={PersonalDataFormScreen} options={{ title: 'Dados Pessoais' }} />
          <Stack.Screen name="CommercialDataForm" component={CommercialDataFormScreen} options={{ title: 'Dados Comerciais' }} />
          <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Documentos' }} />
          <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} options={{ title: 'Revisão' }} />
          <Stack.Screen name="Success" component={SuccessScreen} options={{ title: 'Sucesso', headerShown: false }} />
          
          <Stack.Screen name="AngariadorDataForm" component={AngariadorDataFormScreen} options={{ title: 'Novo Angariador' }} />
          <Stack.Screen name="AngariadoresList" component={AngariadoresListScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};
