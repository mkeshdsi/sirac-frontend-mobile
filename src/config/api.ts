import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const KEY_API_BASE_URL = 'sirac_api_base_url';
const DEFAULT_BASE_URL = 'http://10.100.33.169:8055'; // IP da máquina para uso no Expo Go
const KEY_AUTH_TOKEN = 'sirac_auth_token';

function normalizeBase(url: string): string {
  if (!url) return url;
  return url.replace(/\/$/, ''); // remove barra no final
}

function deriveBaseFromExpo(): string | null {
  try {
    // hostUri exemplos: '192.168.0.10:19000', 'exp.host/...', etc.
    const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest2?.hostUri || (Constants as any)?.manifest?.hostUri;
    if (!hostUri || typeof hostUri !== 'string') return null;
    const host = hostUri.split(':')[0];
    if (!host || host.includes('exp.host')) return null;
    // Porta padrão do backend conforme main.py: 8055
    return `http://${host}:8055`;
  } catch {
    return null;
  }
}

export async function getBaseUrl(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(KEY_API_BASE_URL);
    const derived = deriveBaseFromExpo();
    return normalizeBase(saved || derived || DEFAULT_BASE_URL);
  } catch {
    const derived = deriveBaseFromExpo();
    return normalizeBase(derived || DEFAULT_BASE_URL);
  }
}

export async function setBaseUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_API_BASE_URL, url);
}

export async function getApi(): Promise<AxiosInstance> {
  const baseURL = await getBaseUrl();
  return axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getAuthApi(): Promise<AxiosInstance> {
  const baseURL = await getBaseUrl();
  const token = await SecureStore.getItemAsync(KEY_AUTH_TOKEN);
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });
  if (token) {
    instance.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
      return config;
    });
  }
  return instance;
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_AUTH_TOKEN, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_AUTH_TOKEN);
}
