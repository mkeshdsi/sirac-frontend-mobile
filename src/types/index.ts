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
  // Campos adicionais
  assinatura?: string;
  dataFormulario?: string; // dd/mm/aaaa

  // Empresa
  tipoEmpresa?: 'Sociedade' | 'Individual';
  designacao?: string;
  naturezaObjecto?: string;
  banco?: string;
  numeroConta?: string;

  // Endereço
  enderecoCidade?: string;
  enderecoLocalidade?: string;
  enderecoAvenidaRua?: string;
  enderecoNumero?: string;
  enderecoQuart?: string;
  enderecoBairroRef?: string;
  telefone?: string;
  celular?: string;

  // Proprietários
  proprietarioNomeCompleto?: string;
  proprietarioEmail?: string;
  proprietarioContacto?: string;

  // Estabelecimentos Assistentes
  assistente1NomeCompleto?: string;
  assistente1Contacto?: string;
  assistente2NomeCompleto?: string;
  assistente2Contacto?: string;

  // Angariador
  angariadorNome?: string;
  angariadorCelular?: string;

  // A preencher pela carteira móvel
  validadoPorNome?: string;
  validadoPorFuncao?: string;
  dataValidacao?: string; // dd/mm/aaaa
  aprovadoPorNome?: string;
  aprovadoPorFuncao?: string;
  dataAprovacao?: string; // dd/mm/aaaa

  // Substituição e outros
  substituicaoNomeAgente?: string;
  substituicaoProvinciaLocalidade?: string;
  substituicaoEnderecoBairro?: string;
  parceiroOficial?: string;
  profissao?: string;
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
  ApiConfig: undefined;
  Welcome: undefined;
  UserTypeSelection: undefined;
  PersonalDataForm: { userType: UserType };
  PasswordCreation: { userType: UserType; personalData: PersonalData };
  CommercialDataForm: { personalData: PersonalData; password: string };
  DocumentUpload: { personalData: PersonalData; password: string; commercialData?: CommercialData };
  ReviewSubmit: { personalData: PersonalData; commercialData?: CommercialData; documents: DocumentsPayload };
  Success: { registrationId: string };
};
