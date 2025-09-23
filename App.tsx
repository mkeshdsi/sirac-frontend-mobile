import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Theme } from '@/constants/theme';
import { RootStackParamList } from '@/types';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { UserTypeSelectionScreen } from '@/screens/UserTypeSelectionScreen';
import { PersonalDataFormScreen } from '@/screens/PersonalDataFormScreen';
import { CommercialDataFormScreen } from '@/screens/CommercialDataFormScreen';
import { DocumentUploadScreen } from '@/screens/DocumentUploadScreen';
import { ReviewSubmitScreen } from '@/screens/ReviewSubmitScreen';
import { SuccessScreen } from '@/screens/SuccessScreen';
import { PasswordCreationScreen } from '@/screens/PasswordCreationScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { TokenVerificationScreen } from '@/screens/TokenVerificationScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.background} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.textPrimary,
          headerTitleStyle: { ...Theme.typography.h4 },
          cardStyle: { backgroundColor: Theme.colors.background },
        }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TokenVerification" component={TokenVerificationScreen} options={{ title: 'Verificar Token' }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: 'SIRAC' }} />
        <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} options={{ title: 'Perfil' }} />
        <Stack.Screen name="PasswordCreation" component={PasswordCreationScreen} options={{ title: 'Palavra‑Passe' }} />
        <Stack.Screen name="PersonalDataForm" component={PersonalDataFormScreen} options={{ title: 'Dados Pessoais' }} />
        <Stack.Screen name="CommercialDataForm" component={CommercialDataFormScreen} options={{ title: 'Dados Comerciais' }} />
        <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Documentos' }} />
        <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} options={{ title: 'Revisão' }} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ title: 'Sucesso' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

