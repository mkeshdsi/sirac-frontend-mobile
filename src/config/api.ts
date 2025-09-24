import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const KEY_API_BASE_URL = 'sirac_api_base_url';
const DEFAULT_BASE_URL = 'http://192.168.137.1:8000'; // Hotspot Windows por padrão
const KEY_AUTH_TOKEN = 'sirac_auth_token';

export async function getBaseUrl(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(KEY_API_BASE_URL);
    return saved || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
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
