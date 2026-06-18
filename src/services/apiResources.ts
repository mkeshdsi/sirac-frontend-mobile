import { AxiosInstance } from 'axios';
import { getAuthApi } from '@/config/api';

export type ListParams = {
  page?: number;
  q?: string;
  limit?: number;
};

async function listResource(api: AxiosInstance, path: string, params?: ListParams) {
  try {
    const res = await api.get(path, { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    return [] as any[];
  }
}

async function listResourceStrict(api: AxiosInstance, path: string, params?: ListParams) {
  const res = await api.get(path, { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function listEnderecos(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/enderecos/', params);
}

export type DashboardOverview = {
  scope: 'user' | 'tvr' | 'angariador';
  actor: { id: number; type: string; nome: string };
  totals: {
    parceiros: number;
    angariadores: number;
    tvrs: number;
    parceiros_mes: number;
  };
  progress: {
    month_total: number;
    previous_month_total: number;
    growth_percent: number;
  };
  series: Array<{ label: string; value: number }>;
  breakdown: {
    diretos_tvr: number;
    por_angariadores: number;
    por_users: number;
  };
  top_angariadores: Array<{ id: number; nome: string; total: number }>;
  top_tvrs: Array<{ id: number; nome: string; total: number }>;
  recent_parceiros: Array<{ id: number; designacao: string; tipo_parceiro: string; data_adesao?: string; origem?: string }>;
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const api = await getAuthApi();
  const res = await api.get('/api/v1/dashboard/overview');
  return res.data;
}

export type LocalizacaoOption = {
  id: number;
  nivel: string;
  nome_display: string;
  provincia_id?: number;
  provincia?: string;
  distrito_id?: number;
  distrito?: string;
  posto_administrativo_id?: number;
  posto_administrativo?: string;
  localidade_id?: number;
  localidade?: string;
  bairro_id?: number;
  bairro?: string;
};

export type Angariador = {
  id: number;
  msisdn: string;
  email: string;
  nome: string;
  bi: string;
  nuit?: string;
  localizacao_id?: number;
  localizacao?: LocalizacaoOption;
  bi_frente?: string;
  bi_verso?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  ultima_vez_online?: string;
  created_by: {
    user_id?: number;
    tvr_id?: number;
    name?: string;
    type?: string;
    id?: number;
  };
};

export async function searchLocalizacoes(q: string, limit = 25): Promise<LocalizacaoOption[]> {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/localizacoes/search', { q, limit });
}

// Usando endpoint de users com filtro usertype (ajustado conforme backend)
// Backend nao tem filtro, entao buscamos todos e filtramos no front
async function listUsersByType(type: string, params?: ListParams) {
  const api = await getAuthApi();
  // Busca TODOS os usuarios
  const res = await api.get('/api/v1/users/', { params });
  const allUsers = Array.isArray(res.data) ? res.data : [];

  // Filtra localmente pelo usertype
  // Verifique se o backend retorna 'Angariador' ou 'angariador' etc. 
  // O model User.to_dict retorna o campo "usertype".
  return allUsers.filter((u: any) => u.usertype === type);
}

export async function listAngariadores(params?: ListParams) {
  return listUsersByType('Angariador', params);
}

export async function listParceiros(params?: ListParams) {
  const api = await getAuthApi();
  return listResourceStrict(api, '/api/v1/parceiros/', params);
}

export async function getParceirosGroupedDetailed() {
  const api = await getAuthApi();
  const res = await api.get('/api/v1/parceiros/grouped-detailed');
  return res.data || { users: [], tvrs: [], angariadores: [] };
}

export async function listTvrs(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/tvr/', params);
}

export async function cadastrarTvr(payload: any) {
  const api = await getAuthApi();
  const res = await api.post('/api/v1/tvr/', payload);
  return res.data;
}

export async function updateTvrPassword(tvrId: number, payload: { password: string }) {
  const api = await getAuthApi();
  const res = await api.put(`/api/v1/tvr/${tvrId}`, payload);
  return res.data;
}

export async function listValidadores(params?: ListParams) {
  return listUsersByType('Validador', params);
}

export async function listAprovadores(params?: ListParams) {
  return listUsersByType('Aprovador', params);
}

export async function listProprietarios(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/proprietarios/', params);
}

export async function listAssistentes(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/assistentes/', params);
}

export async function listEstabelecimentos(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/estabelecimentos/', params);
}

export async function listAdesoes(params?: ListParams) {
  const api = await getAuthApi();
  // Adesões são parceiros no contexto atual
  return listResource(api, '/api/v1/parceiros/', params);
}

// Create adesao (commercial data submission)
export async function createAdesao(payload: any) {
  const api = await getAuthApi();
  // Backend registra parceiro_bp em /api/v1/parceiros (ver backend/sirac/main.py)
  const res = await api.post('/api/v1/parceiros/', payload);
  return res.data;
}

export async function getAngariadoresGrouped() {
  const api = await getAuthApi();
  try {
    const res = await api.get('/api/v1/angariadores/grouped-by-tvr');
    return res.data;
  } catch (e) {
    console.error('Error fetching grouped angariadores:', e);
    return { data: [], total_geral: 0 };
  }
}

export async function listMyAngariadores() {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/angariadores/meus');
}

export async function cadastrarAngariador(payload: any) {
  const api = await getAuthApi();
  const { password, ...payloadWithoutPassword } = payload || {};
  const res = await api.post('/api/v1/angariadores/', payloadWithoutPassword);
  return res.data;
}

export async function updateAngariadorPassword(angariadorId: number, payload: { email: string; new_password: string }) {
  const api = await getAuthApi();
  const res = await api.put(`/api/v1/angariadores/${angariadorId}/update-password`, payload);
  return res.data;
}

export async function updateMyAngariadorPassword(payload: { email: string; old_password: string; new_password: string }) {
  const api = await getAuthApi();
  const res = await api.put('/api/v1/angariadores/me/update-password', payload);
  return res.data;
}

export async function changeMyTvrPassword(payload: { old_password: string; new_password: string }) {
  const api = await getAuthApi();
  const res = await api.put('/api/v1/tvr/me/change-password', payload);
  return res.data;
}

export async function toggleAngariadorActive(angariadorId: number, isActive: boolean) {
  const api = await getAuthApi();
  const res = await api.patch(`/api/v1/angariadores/${angariadorId}/active`, { is_active: isActive });
  return res.data;
}

export async function toggleTvrActive(tvrId: number, isActive: boolean) {
  const api = await getAuthApi();
  const res = await api.patch(`/api/v1/tvr/${tvrId}/active`, { is_active: isActive });
  return res.data;
}
