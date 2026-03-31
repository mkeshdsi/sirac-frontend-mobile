import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { getItem, setItem, deleteItem } from '@/utils/storage';
export { getItem, setItem, deleteItem };

const KEY_API_BASE_URL = 'sirac_api_base_url';
const KEY_AUTH_TOKEN = 'sirac_auth_token';

function normalizeBase(url: string): string {
  return url ? url.replace(/\/$/, '') : '';
}

export async function getBaseUrl(): Promise<string> {
  const envUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Constants as any)?.expoConfig?.extra?.apiBaseUrl ||
    (Constants as any)?.manifest2?.extra?.apiBaseUrl ||
    (Constants as any)?.manifest?.extra?.apiBaseUrl;

  if (envUrl && typeof envUrl === 'string') {
    return normalizeBase(envUrl);
  }

  try {
    const saved = await getItem(KEY_API_BASE_URL);
    if (saved) return normalizeBase(saved);
  } catch {
    // ignore
  }

  return '';
}

export async function setBaseUrl(url: string): Promise<void> {
  await setItem(KEY_API_BASE_URL, url);
}

export async function getApi(): Promise<AxiosInstance> {
  const baseURL = await getBaseUrl();
  return axios.create({
    baseURL,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getAuthApi(): Promise<AxiosInstance> {
  const baseURL = await getBaseUrl();
  const token = await getItem(KEY_AUTH_TOKEN);
  const instance = axios.create({
    baseURL,
    timeout: 60000,
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
