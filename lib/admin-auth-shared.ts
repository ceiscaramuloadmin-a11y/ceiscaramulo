import type { AdminPermission, AdminRole } from '@/types';

export const ADMIN_SESSION_STORAGE_KEY = 'ceis.admin.session';
export const ADMIN_SIGNED_OUT_COOKIE = 'ceis.admin.signedOut';
export const ADMIN_SIGNED_OUT_COOKIE_MAX_AGE_SECONDS = 60 * 10;
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type AdminAuthMode = 'runtime' | 'export';

export type AdminSession = {
  token: string | null;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  expiresAt: string | null;
  mode: AdminAuthMode;
};

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'admins', 'audit'];

export function getPublicAdminAuthMode(): AdminAuthMode {
  return process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE === 'export' ? 'export' : 'runtime';
}

export function getDefaultAdminPermissions(role: AdminRole) {
  if (role === 'owner') {
    return [...ALL_ADMIN_PERMISSIONS];
  }

  return ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'audit'] as AdminPermission[];
}

export function normalizeAdminRole(value: unknown): AdminRole {
  return value === 'owner' ? 'owner' : 'editor';
}

export function parseAdminPermissions(value: unknown, role: AdminRole): AdminPermission[] {
  if (role === 'owner') {
    return getDefaultAdminPermissions(role);
  }

  if (!Array.isArray(value)) {
    return getDefaultAdminPermissions(role);
  }

  const parsed = value
    .map((item) => String(item).trim())
    .filter((item): item is AdminPermission => ALL_ADMIN_PERMISSIONS.includes(item as AdminPermission));

  return parsed.length > 0 ? parsed : getDefaultAdminPermissions(role);
}

export function normalizeAdminSession(value: unknown): AdminSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const email = String(candidate.email ?? '').trim().toLowerCase();

  if (!email) {
    return null;
  }

  const role = normalizeAdminRole(candidate.role);

  return {
    token: candidate.token ? String(candidate.token) : null,
    email,
    role,
    permissions: parseAdminPermissions(candidate.permissions, role),
    expiresAt: candidate.expiresAt ? String(candidate.expiresAt) : null,
    mode: candidate.mode === 'export' ? 'export' : 'runtime',
  };
}

export function isAdminSessionExpired(session: AdminSession) {
  if (!session.expiresAt) {
    return false;
  }

  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function createSessionExpiryDate(maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS) {
  return new Date(Date.now() + maxAgeSeconds * 1000).toISOString();
}
