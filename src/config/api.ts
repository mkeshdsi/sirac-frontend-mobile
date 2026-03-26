import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { getItem, setItem, deleteItem } from '@/utils/storage';
export { getItem, setItem, deleteItem };

const KEY_API_BASE_URL = 'sirac_api_base_url';
const DEFAULT_BASE_URL = 'http://41.220.193.110';
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
    const saved = await getItem(KEY_API_BASE_URL);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return normalizeBase(saved || DEFAULT_BASE_URL);
    }
    const url = normalizeBase(saved || DEFAULT_BASE_URL);
    return url;
  } catch {
    const url = normalizeBase(DEFAULT_BASE_URL);
    return url;
  }
}

export async function setBaseUrl(url: string): Promise<void> {
  await setItem(KEY_API_BASE_URL, url);
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
  const token = await getItem(KEY_AUTH_TOKEN);
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
  await setItem(KEY_AUTH_TOKEN, token);
}

export async function clearAuthToken(): Promise<void> {
  await deleteItem(KEY_AUTH_TOKEN);
}
