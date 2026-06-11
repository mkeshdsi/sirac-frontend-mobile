import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuthApi, getItem, setItem, deleteItem } from '@/config/api';

export type AuthRole = 'user' | 'angariador' | 'tvr' | null;

interface AuthContextData {
  userRole: AuthRole;
  userData: any | null;
  isLoading: boolean;
  signIn: (role: AuthRole, data: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<AuthRole>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const storedRole = await getItem('sirac_user_role');
      const storedData = await getItem('sirac_user_data');
      const storedToken = await getItem('sirac_auth_token');
      
      if (!storedRole || !storedToken) {
        await signOut();
        return;
      }

      const api = await getAuthApi();
      const res = await api.get('/api/v1/auth/me');
      const serverRole = (res.data?.type || storedRole) as AuthRole;
      const serverData = res.data?.data || (storedData ? JSON.parse(storedData) : null);

      setUserRole(serverRole);
      setUserData(serverData);
      await setItem('sirac_user_role', serverRole || '');
      if (serverData) await setItem('sirac_user_data', JSON.stringify(serverData));
    } catch (e) {
      console.log('Error loading auth data', e);
      await signOut();
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(role: AuthRole, data: any) {
    setUserRole(role);
    setUserData(data);
    await setItem('sirac_user_role', role || '');
    if (data) {
      await setItem('sirac_user_data', JSON.stringify(data));
    }
  }

  async function signOut() {
    setUserRole(null);
    setUserData(null);
    await deleteItem('sirac_user_role');
    await deleteItem('sirac_user_data');
    await deleteItem('sirac_auth_token');
  }

  return (
    <AuthContext.Provider value={{ userRole, userData, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
