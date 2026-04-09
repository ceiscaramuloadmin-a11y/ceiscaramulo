import { getAdminAccessToken } from './neon-auth';
import type {
  Activity,
  AdminStats,
  ContentComment,
  ContentSection,
  NewsArticle,
  Project,
  Publication,
} from '../types';

// Resolve a base da API uma única vez no arranque do módulo.
// Em produção o ideal é vir do ambiente. Em desenvolvimento, este fallback
// evita que o frontend tente falar com o Vite (`:8080`) quando a API real está
// noutra porta (`:3001`).
const API_BASE_URL = resolveApiBaseUrl();

type SectionMap = {
  news: NewsArticle;
  activities: Activity;
  projects: Project;
  publications: Publication;
};

type Scope = 'public' | 'admin';

export function getAssetUrl(value?: string | null) {
  if (!value) {
    return '/placeholder.svg';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    // Uploads antigos guardados como caminhos locais deixam de existir quando a
    // app é publicada como frontend + funções serverless na Vercel. Nesses
    // casos mostramos o placeholder para evitar 404 visíveis na UI.
    if (shouldFallbackUploadToPlaceholder()) {
      return '/placeholder.svg';
    }

    return `${API_BASE_URL}${value}`;
  }

  return value;
}

export async function fetchStats() {
  return request<AdminStats>('/api/admin/stats', undefined, true);
}

export async function fetchCollection<T extends ContentSection>(section: T, scope: Scope = 'public') {
  return request<SectionMap[T][]>(`/api/${section}?scope=${scope}`, undefined, scope === 'admin');
}

export async function fetchItem<T extends ContentSection>(section: T, identifier: string, scope: Scope = 'public') {
  return request<SectionMap[T]>(`/api/${section}/${identifier}?scope=${scope}`, undefined, scope === 'admin');
}

export async function createItem(section: ContentSection, values: Record<string, FormDataEntryValue | null>) {
  const formData = createFormData(values);
  return request(`/api/${section}`, { method: 'POST', body: formData }, true);
}

export async function updateItem(section: ContentSection, id: string, values: Record<string, FormDataEntryValue | null>) {
  const formData = createFormData(values);
  return request(`/api/${section}/${id}`, { method: 'PUT', body: formData }, true);
}

export async function deleteItem(section: ContentSection, id: string) {
  return request(`/api/${section}/${id}`, { method: 'DELETE' }, true);
}

export async function fetchComments(section: ContentSection, identifier: string) {
  return request<ContentComment[]>(`/api/${section}/${identifier}/comments`);
}

export async function createComment(
  section: ContentSection,
  identifier: string,
  values: { name: string; email: string; message: string }
) {
  return request<ContentComment>(`/api/${section}/${identifier}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  });
}

async function request<T>(path: string, init?: RequestInit, requiresAuth = false): Promise<T> {
  const headers = new Headers(init?.headers);

  if (requiresAuth) {
    // As rotas admin exigem token Neon. Se o token não existir, paramos aqui
    // com uma mensagem clara para o backoffice não disparar pedidos inválidos.
    const token = await getAdminAccessToken();

    if (!token) {
      throw new Error('A tua sessão Neon expirou ou não está ativa.');
    }

    headers.set('Authorization', `Bearer ${token}`);
  }

  // Todas as chamadas passam por este ponto central para partilhar a mesma
  // política de autenticação, serialização e tratamento de erros.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    // Tentamos aproveitar a mensagem da API. Se a resposta não vier em JSON,
    // devolvemos um fallback legível para a interface.
    const payload = await safeJson(response);
    throw new Error(payload?.message || 'Não foi possível concluir o pedido.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createFormData(values: Record<string, FormDataEntryValue | null>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    // Reaproveita o host atual do browser e muda apenas a porta, para funcionar
    // tanto com `localhost` como com `127.0.0.1` ou IPs locais.
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }

  return '';
}

function shouldFallbackUploadToPlaceholder() {
  if (import.meta.env.DEV || !API_BASE_URL || typeof window === 'undefined') {
    return false;
  }

  try {
    return new URL(API_BASE_URL).origin === window.location.origin;
  } catch {
    return false;
  }
}
