import { delay } from '../utils/delay';

// Serviço de autenticação (stub) para simular chamadas à API
// Em produção, substitua por chamadas reais (fetch/axios) ao backend.
export async function login(username: string, password: string): Promise<{ success: boolean; maskedDestination: string }>{
  // Simula latência
  await delay(700);
  // Validação básica mock
  if (!username || !password) return { success: false, maskedDestination: '' };
  // Simula que o token foi enviado (por SMS/Email) para um destino mascarado
  const masked = username.includes('@')
    ? username.replace(/(^.).*(@.*$)/, '$1***$2')
    : username.replace(/(.*)(....$)/, '***$2');
  return { success: true, maskedDestination: masked };
}

export async function verifyToken(username: string, token: string): Promise<{ success: boolean }>{
  await delay(600);
  // Regra mock: qualquer token de 6 dígitos é válido
  const ok = /^\d{6}$/.test(token);
  return { success: ok };
}
