import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/types';
import { Theme } from '@/constants/theme';

// Public Screens
import { LoginScreen } from '@/screens/LoginScreen';
import { FirstLoginPasswordChangeScreen } from '@/screens/FirstLoginPasswordChangeScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen';

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
import { ParceirosListScreen } from '@/screens/ParceirosListScreen';
import { TvrDataFormScreen } from '@/screens/TvrDataFormScreen';
import { TvrsListScreen } from '@/screens/TvrsListScreen';

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
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FirstLoginPasswordChange" component={FirstLoginPasswordChangeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        </>
      ) : (
        // Private Flow
        <>
          <Stack.Screen name="Dashboard" component={DashboardTabs} options={{ headerShown: false, title: 'SIRAC' }} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PasswordCreation" component={PasswordCreationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PersonalDataForm" component={PersonalDataFormScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CommercialDataForm" component={CommercialDataFormScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Success" component={SuccessScreen} options={{ title: 'Sucesso', headerShown: false }} />
          
          <Stack.Screen name="AngariadorDataForm" component={AngariadorDataFormScreen} options={{ title: 'Novo Angariador' }} />
          <Stack.Screen name="AngariadoresList" component={AngariadoresListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ParceirosList" component={ParceirosListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TvrDataForm" component={TvrDataFormScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TvrsList" component={TvrsListScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};
