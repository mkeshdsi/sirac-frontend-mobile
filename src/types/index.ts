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

  // Tipo de Parceiro (alinhado com API)
  tipoParceiro?: 'AGENTE' | 'MERCHANT';

  // Empresa
  tipoEmpresa?: 'SOCIEDADE' | 'INDIVIDUAL';
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
  // Lista de proprietários (novo)
  proprietarios?: Array<{ nome?: string; email?: string; contacto?: string }>;

  // Assistentes (lista dinâmica)
  assistentes?: Array<{ nomeCompleto?: string; contacto?: string }>; 

  // Relações (IDs opcionais)
  angariadorId?: string; // enviar como número no payload se preenchido
  aprovadorId?: string;   // enviar como número no payload se preenchido
  validadorId?: string;   // enviar como número no payload se preenchido

  // Substituição e outros
  substituicaoNomeAgente?: string;
  substituicaoProvinciaLocalidade?: string;
  substituicaoEnderecoBairro?: string;
  profissao?: string;
  // Lista de estabelecimentos (novo)
  estabelecimentos?: Array<{ nome?: string; provinciaLocalidade?: string; enderecoBairro?: string }>;
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
  PersonalDataForm: undefined; // removido do fluxo principal
  PasswordCreation: undefined; // removido do fluxo principal
  CommercialDataForm: undefined;
  DocumentUpload: { commercialData?: CommercialData };
  ReviewSubmit: { commercialData?: CommercialData; documents: DocumentsPayload };
  Success: { registrationId: string };
};
