import { getApi, setAuthToken } from '@/config/api';

export async function login(email: string, password: string): Promise<{ success: boolean; token?: string; message?: string; status?: number }> {
  try {
    const api = await getApi();
    const res = await api.post('/api/login', { email, password, device_name: 'sirac-mobile' });
    const token = res.data?.token || res.data?.access_token || res.data?.data?.token;
    if (!token) {
      return { success: false, message: 'Resposta sem token', status: res.status };
    }
    // Persistir token para uso nas próximas chamadas
    await setAuthToken(token);
    return { success: true, token };
  } catch (e: any) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message || e?.message || 'Falha ao iniciar sessão';
    return { success: false, message: msg, status };
  }
}
