import React, { createContext, useState, useEffect, useContext } from 'react';
import { getItem, setItem, deleteItem } from '@/config/api';

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
      
      if (storedRole) {
        setUserRole(storedRole as AuthRole);
      }
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } catch (e) {
      console.log('Error loading auth data', e);
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
