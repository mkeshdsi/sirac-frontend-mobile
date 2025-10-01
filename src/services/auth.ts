import { getApi, setAuthToken } from '@/config/api';

export async function login(email: string, password: string): Promise<{ success: boolean; token?: string; message?: string; status?: number }> {
  try {
    const api = await getApi();
    // Endpoint correto no backend: '/api/v1/auth/login'
    const res = await api.post('/api/v1/auth/login', { email, password, device_name: 'sirac-mobile' });
    // Backend retorna 'access_token'
    const token = res.data?.access_token;
    if (!token) {
      return { success: false, message: 'Resposta de login sem access_token', status: res.status };
    }
    // Persistir token para uso nas próximas chamadas
    await setAuthToken(token);
    return { success: true, token };
  } catch (e: any) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.msg || e?.message || 'Falha ao iniciar sessão';
    return { success: false, message: msg, status };
  }
}
