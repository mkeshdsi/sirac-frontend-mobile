import { getApi, setAuthToken, setItem } from '@/config/api';

export async function login(email: string, password: string): Promise<{ success: boolean; token?: string; message?: string; status?: number }> {
  try {
    const api = await getApi();
    // Endpoint correto no backend: '/api/v1/auth/login'
    const res = await api.post('/api/v1/auth/login', { email, password, device_name: 'sirac-mobile' });
    // Backend retorna 'access_token' e 'user'
    const token = res.data?.access_token;
    const user = res.data?.user;

    if (!token) {
      return { success: false, message: 'Resposta de login sem access_token', status: res.status };
    }
    // Persistir token e usuario para uso nas próximas chamadas
    await setAuthToken(token);
    if (user) {
      await setItem('sirac_user_data', JSON.stringify(user));
    }

    return { success: true, token };
  } catch (e: any) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.msg || e?.message || 'Falha ao iniciar sessão';
    return { success: false, message: msg, status };
  }
}
