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

export async function listAngariadores(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/angariadores/', params);
}

export async function listParceiros(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/parceiros/', params);
}

export async function listValidadores(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/validadores/', params);
}

export async function listAprovadores(params?: ListParams) {
  const api = await getAuthApi();
  return listResource(api, '/api/v1/aprovadores/', params);
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
  return listResource(api, '/api/v1/adesoes/', params);
}
