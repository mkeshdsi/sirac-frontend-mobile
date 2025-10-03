import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const WEB_PREFIX = 'sirac_';

export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(WEB_PREFIX + key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(WEB_PREFIX + key, value ?? '');
      }
      return;
    }
    await SecureStore.setItemAsync(key, value ?? '');
  } catch {
    // no-op on web or errors
  }
}

export async function deleteItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(WEB_PREFIX + key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // no-op
  }
}
