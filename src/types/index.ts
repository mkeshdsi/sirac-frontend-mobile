export type UserType = 'Comerciante' | 'TecnicoComercial';

export interface PersonalData {
  nome: string;
  telefone: string;
  biNumero: string;
}

export interface CommercialData {
  nomeComercial: string;
  nuit: string;
  alvara: string;
}

export interface DocumentsPayload {
  biFrenteUri?: string;
  biVersoUri?: string;
  alvaraUri?: string;
  comprovativoResidenciaUri?: string;
  fotoPerfilUri?: string;
}

export type RootStackParamList = {
  Login: undefined;
  TokenVerification: { username: string; maskedDestination: string };
  Welcome: undefined;
  UserTypeSelection: undefined;
  PersonalDataForm: { userType: UserType };
  PasswordCreation: { userType: UserType; personalData: PersonalData };
  CommercialDataForm: { personalData: PersonalData; password: string };
  DocumentUpload: { personalData: PersonalData; password: string; commercialData?: CommercialData };
  ReviewSubmit: { personalData: PersonalData; commercialData?: CommercialData; documents: DocumentsPayload };
  Success: { registrationId: string };
};
