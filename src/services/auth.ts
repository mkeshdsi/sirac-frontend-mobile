import { getApi, getBaseUrl, setAuthToken, setItem } from '@/config/api';

export type ForcePasswordChange = {
  angariador_id: number;
  email: string;
  msisdn?: string;
  force_password_change: true;
  msg?: string;
};

export async function login(
  msisdn: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: any; type?: string; message?: string; status?: number; forcePasswordChange?: ForcePasswordChange }> {
  try {
    const base = await getBaseUrl();

    // Direct fetch call - more reliable than axios in some Android builds
    const response = await fetch(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msisdn, contacto: msisdn, password, device_name: 'sirac-mobile' }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if ((data as any)?.force_password_change) {
        return {
          success: false,
          message: (data as any)?.msg || 'Primeiro login requer alteração de password',
          status: response.status,
          forcePasswordChange: data as ForcePasswordChange,
        };
      }

      const msg = (data as any)?.msg || (data as any)?.message || `Erro ${response.status}`;
      return { success: false, message: msg, status: response.status };
    }

    const token = (data as any)?.access_token;
    const user = (data as any)?.user;
    const type = (data as any)?.type;

    if (!token) {
      return { success: false, message: 'Resposta do servidor sem access_token', status: response.status };
    }

    await setAuthToken(token);
    if (user) {
      await setItem('sirac_user_data', JSON.stringify(user));
    }

    return { success: true, token, user, type };
  } catch (e: any) {
    const msg = e?.message || 'Falha ao iniciar sessão. Verifique a sua ligação.';
    return { success: false, message: msg };
  }
}

export async function updateAngariadorFirstLoginPassword(payload: {
  email: string;
  old_password: string;
  new_password: string;
}) {
  const api = await getApi();
  const res = await api.post('/api/v1/angariadores/first-login/update-password', payload);
  return res.data;
}

export async function requestPasswordResetPin(type: 'angariador' | 'tvr', email: string) {
  const api = await getApi();
  const path = type === 'tvr' ? '/api/v1/tvr/password/request-pin' : '/api/v1/angariadores/password/request-pin';
  const res = await api.post(path, { email });
  return res.data;
}

export async function resetPasswordWithPin(type: 'angariador' | 'tvr', payload: {
  email: string;
  pin: string;
  new_password: string;
}) {
  const api = await getApi();
  const path = type === 'tvr' ? '/api/v1/tvr/password/reset' : '/api/v1/angariadores/password/reset';
  const res = await api.post(path, payload);
  return res.data;
}

export async function verifyToken(username: string, token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const api = await getApi();
    await api.post('/api/v1/auth/verify-token', { username, token });
    return { success: true };
  } catch (e: any) {
    return {
      success: false,
      message: e?.response?.data?.msg || e?.response?.data?.message || 'Token inválido.',
    };
  }
}
