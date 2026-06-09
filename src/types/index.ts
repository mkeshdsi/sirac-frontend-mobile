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
  contactoAgente?: string;
  tipoDocumento?: 'BI' | 'PASSAPORTE' | 'CARTAO_ELEITOR' | 'CARTA_CONDUCAO';
  numeroDocumento?: string;
  assinatura?: string;
  dataFormulario?: string;
  dataValidacao?: string;
  dataAprovacao?: string;
  tipoParceiro?: 'AGENTE' | 'MERCHANT';
  tipoEmpresa?: 'SOCIEDADE' | 'INDIVIDUAL';
  designacao?: string;
  naturezaObjecto?: string;
  banco?: string;
  numeroConta?: string;
  profissao?: string;
  enderecoCidade?: string;
  enderecoLocalidade?: string;
  enderecoAvenidaRua?: string;
  enderecoNumero?: string;
  enderecoQuart?: string;
  enderecoBairroRef?: string;
  telefone?: string;
  celular?: string;
  proprietarioNomeCompleto?: string;
  proprietarioEmail?: string;
  proprietarioContacto?: string;
  proprietarios?: Array<{ nome?: string; email?: string; contacto?: string }>;
  assistentes?: Array<{ nomeCompleto?: string; contacto?: string }>;
  estabelecimentos?: Array<{ nome?: string; provinciaLocalidade?: string; enderecoBairro?: string }>;
  substituicaoNomeAgente?: string;
  substituicaoProvinciaLocalidade?: string;
  substituicaoEnderecoBairro?: string;
  latitude?: number;
  longitude?: number;
  fotografia?: string;
}

export interface DocumentsPayload {
  biFrenteUri?: string;
  biVersoUri?: string;
  nuitUri?: string;
  alvaraUri?: string;
}

export type RootStackParamList = {
  Login: undefined;
  FirstLoginPasswordChange: { oldPassword: string; angariadorId?: number; tvrId?: number; msisdn: string; accountType: 'angariador' | 'tvr' };
  ForgotPassword: undefined;
  ResetPassword: { msisdn: string; accountType: 'angariador' | 'tvr' };
  TokenVerification: { username: string; maskedDestination: string };
  Dashboard: undefined; // The nested tab navigator
  ApiConfig: undefined;
  Welcome: undefined;
  UserTypeSelection: undefined;
  PersonalDataForm: undefined;
  PasswordCreation: { userType: UserType; personalData: PersonalData };
  CommercialDataForm: { personalData: PersonalData; password?: string; userType?: UserType };
  DocumentUpload: { commercialData?: CommercialData; personalData?: PersonalData; password?: string; userType?: UserType };
  ReviewSubmit: { commercialData?: CommercialData; documents: DocumentsPayload };
  Success: { registrationId: string };
  AngariadorDataForm: undefined;
  AngariadoresList: undefined;
  ParceirosList: undefined;
  TvrDataForm: undefined;
  TvrsList: undefined;
};
export type DashboardTabParamList = {
  Home: undefined;
  AngariadoresList: undefined; // where TVR grouped list lives
};
