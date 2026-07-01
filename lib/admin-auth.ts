'use client';

import { useSyncExternalStore } from 'react';
import type { AdminPermission, AdminRole } from '@/types';
import {
  ADMIN_SESSION_STORAGE_KEY,
  createSessionExpiryDate,
  getDefaultAdminPermissions,
  getPublicAdminAuthMode,
  isAdminSessionExpired,
  normalizeAdminSession,
  parseAdminPermissions,
  type AdminSession,
  type AdminAuthMode,
} from '@/lib/admin-auth-shared';

export const AUTH0_ADMIN_LOGIN_PATH = '/auth/login?returnTo=%2Fbackoffice';
export const AUTH0_ADMIN_LOGOUT_PATH = '/auth/logout?returnTo=%2Fbackoffice%2Flogin';

type Auth0LoginLocation = Pick<Location, 'hostname' | 'port'>;

type SignInResult =
  | { data: { session: AdminSession }; error: null }
  | { data: null; error: { message: string } };

type SessionResult = { data: { session: AdminSession } | null };

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = normalizeAdminSession(JSON.parse(raw));

    if (!parsed || isAdminSessionExpired(parsed)) {
      window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    return null;
  }
}

function persistSession(session: AdminSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (session) {
    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  }

  notifyListeners();
}

export function getFirebaseAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message.includes('auth/permission-denied') || error.message.includes('has-been-suspended')) {
    return 'O acesso Firebase deste projeto foi suspenso. Atualize a chave pública do Firebase nas variáveis FIREBASE_* ou reative o projeto/API key no Google Cloud Firebase antes de tentar iniciar sessão.';
  }

  if (error.message.includes('auth/configuration-not-found')) {
    return 'O Firebase Authentication ainda não está configurado para este projeto. Ative o método Email/Password no Firebase Console e confirme o domínio autorizado.';
  }

  if (error.message.includes('auth/invalid-credential')) {
    return 'Credenciais Firebase inválidas.';
  }

  if (error.message.includes('auth/email-already-in-use')) {
    return 'Este email já está registado. Tente entrar em vez de criar conta.';
  }

  if (error.message.includes('auth/invalid-email')) {
    return 'O email introduzido não é válido.';
  }

  if (error.message.includes('auth/weak-password')) {
    return 'A palavra-passe do Firebase é demasiado fraca.';
  }

  if (error.message.includes('auth/user-not-found') || error.message.includes('auth/wrong-password') || error.message.includes('auth/invalid-login-credentials')) {
    return 'Email ou palavra-passe incorretos.';
  }

  return null;
}

async function sha256(value: string) {
  const buffer = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
}

async function signInWithRuntimeSession(email: string, password: string): Promise<SignInResult> {
  return {
    data: null,
    error: {
      message:
        email || password
          ? 'O login administrativo runtime passou a usar Auth0. Use o botão "Entrar com Auth0".'
          : 'Use o botão "Entrar com Auth0" para iniciar a sessão administrativa.',
    },
  };
}

async function refreshRuntimeSession() {
  const response = await fetch('/api/admin/session', {
    method: 'GET',
    credentials: 'include',
  }).catch(() => null);

  if (!response || response.status === 401) {
    persistSession(null);
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        token?: string | null;
        session?: { email: string; role: AdminRole; permissions: AdminPermission[]; expiresAt?: string | null };
      }
    | null;

  if (!response.ok || !payload?.session) {
    persistSession(null);
    return null;
  }

  const session = normalizeAdminSession({
    token: null,
    email: payload.session.email,
    role: payload.session.role,
    permissions: payload.session.permissions,
    expiresAt: payload.session.expiresAt ?? null,
    mode: 'runtime',
  });

  persistSession(session);
  return session;
}

async function signInWithExportSession(email: string, password: string): Promise<SignInResult> {
  const configuredEmail = String(process.env.NEXT_PUBLIC_ADMIN_EXPORT_EMAIL || '').trim().toLowerCase();
  const configuredPasswordHash = String(process.env.NEXT_PUBLIC_ADMIN_EXPORT_PASSWORD_SHA256 || '').trim().toLowerCase();
  const role = process.env.NEXT_PUBLIC_ADMIN_EXPORT_ROLE === 'owner' ? 'owner' : 'editor';
  const configuredPermissions = String(process.env.NEXT_PUBLIC_ADMIN_EXPORT_PERMISSIONS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!configuredEmail || !configuredPasswordHash) {
    return {
      data: null,
      error: {
        message: 'Defina NEXT_PUBLIC_ADMIN_EXPORT_EMAIL e NEXT_PUBLIC_ADMIN_EXPORT_PASSWORD_SHA256 para usar o modo export.',
      },
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await sha256(password);

  if (normalizedEmail !== configuredEmail || passwordHash !== configuredPasswordHash) {
    return {
      data: null,
      error: {
        message: 'Credenciais administrativas inválidas.',
      },
    };
  }

  const session = normalizeAdminSession({
    token: null,
    email: normalizedEmail,
    role,
    permissions: parseAdminPermissions(configuredPermissions, role),
    expiresAt: createSessionExpiryDate(),
    mode: 'export',
  });

  if (!session) {
    return {
      data: null,
      error: {
        message: 'Não foi possível criar a sessão administrativa local.',
      },
    };
  }

  persistSession(session);

  return {
    data: { session },
    error: null,
  };
}

export function isExportAdminAuthMode() {
  return getPublicAdminAuthMode() === 'export';
}

export function getAuth0AdminLoginHref(locationLike?: Auth0LoginLocation) {
  const currentLocation = locationLike ?? (typeof window !== 'undefined' ? window.location : null);
  const hostname = currentLocation?.hostname;

  if (hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') {
    const port = currentLocation?.port ? `:${currentLocation.port}` : '';
    return `http://localhost${port}${AUTH0_ADMIN_LOGIN_PATH}`;
  }

  return AUTH0_ADMIN_LOGIN_PATH;
}

export function getStoredAdminSession() {
  return readStoredSession();
}

export async function getAdminAccessToken() {
  const mode = getPublicAdminAuthMode();

  if (mode === 'export') {
    return readStoredSession()?.token ?? null;
  }

  return null;
}

export const adminAuthClient = {
  adapter: {
    async getSession(): Promise<SessionResult> {
      const mode: AdminAuthMode = getPublicAdminAuthMode();
      const session = mode === 'export' ? readStoredSession() : await refreshRuntimeSession();
      return { data: session ? { session } : null };
    },
    async signOut() {
      if (getPublicAdminAuthMode() === 'runtime') {
        await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);
      }
      persistSession(null);
      return { error: null };
    },
    signIn: {
      async email({ email, password }: { email: string; password: string }) {
        const mode: AdminAuthMode = getPublicAdminAuthMode();
        return mode === 'export' ? signInWithExportSession(email, password) : signInWithRuntimeSession(email, password);
      },
    },
    useSession() {
      const session = useSyncExternalStore(subscribe, readStoredSession, () => null);
      return {
        data: session ? { session } : null,
        isPending: false,
      };
    },
  },
};

export function createLocalAdminSession(input: {
  email: string;
  role?: AdminRole;
  permissions?: AdminPermission[];
  mode?: AdminAuthMode;
}) {
  const role = input.role ?? 'owner';

  return normalizeAdminSession({
    token: null,
    email: input.email.trim().toLowerCase(),
    role,
    permissions: input.permissions ?? getDefaultAdminPermissions(role),
    expiresAt: createSessionExpiryDate(),
    mode: input.mode ?? 'export',
  });
}
