import { getApi, getBaseUrl, setAuthToken, setItem } from '@/config/api';

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: any; message?: string; status?: number }> {
  try {
    const base = await getBaseUrl();

    // Direct fetch call - more reliable than axios in some Android builds
    const response = await fetch(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, device_name: 'sirac-mobile' }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = (data as any)?.msg || (data as any)?.message || `Erro ${response.status}`;
      return { success: false, message: msg, status: response.status };
    }

    const token = (data as any)?.access_token;
    const user = (data as any)?.user;

    if (!token) {
      return { success: false, message: 'Resposta do servidor sem access_token', status: response.status };
    }

    await setAuthToken(token);
    if (user) {
      await setItem('sirac_user_data', JSON.stringify(user));
    }

    return { success: true, token, user };
  } catch (e: any) {
    const msg = e?.message || 'Falha ao iniciar sessão. Verifique a sua ligação.';
    return { success: false, message: msg };
  }
}
