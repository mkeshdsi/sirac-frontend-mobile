import { AxiosInstance } from 'axios';
import { getAuthApi } from '@/config/api';

export type ListParams = {
  page?: number;
  q?: string;
};

async function listResource(api: AxiosInstance, path: string, params?: ListParams) {
  try {
    const res = await api.get(path, { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    return [] as any[];
  }
}

export async function listEnderecos(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/enderecos/', params);
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
  return listResource(api, '/api/v1/parceiros/', params);
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
