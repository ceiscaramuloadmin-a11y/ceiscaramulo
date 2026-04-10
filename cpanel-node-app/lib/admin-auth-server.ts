import { SignJWT, jwtVerify } from 'jose';
import type { AdminPermission, AdminRole } from '@/types';
import { ADMIN_SESSION_MAX_AGE_SECONDS, createSessionExpiryDate, parseAdminPermissions } from '@/lib/admin-auth-shared';

type AdminTokenPayload = {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

function getAdminAuthSecret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
}

function getAdminAuthPassword() {
  return process.env.ADMIN_AUTH_PASSWORD || '';
}

function getJwtSecret() {
  const secret = getAdminAuthSecret();

  if (!secret) {
    throw new Error('Defina ADMIN_AUTH_SECRET para usar a autenticação administrativa.');
  }

  return new TextEncoder().encode(secret);
}

export function validateAdminCredentials(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw new Error('Email e palavra-passe são obrigatórios.');
  }

  const configuredPassword = getAdminAuthPassword();

  if (!configuredPassword) {
    throw new Error('Defina ADMIN_AUTH_PASSWORD para ativar o login administrativo.');
  }

  if (password !== configuredPassword) {
    throw new Error('Credenciais administrativas inválidas.');
  }

  return { email };
}

export async function createAdminSessionToken(payload: AdminTokenPayload) {
  const expiresAt = createSessionExpiryDate();

  const token = await new SignJWT({
    email: payload.email,
    role: payload.role,
    permissions: parseAdminPermissions(payload.permissions, payload.role),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.email)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());

  return {
    token,
    expiresAt,
  };
}

export async function verifyAdminSessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const role = payload.role === 'owner' ? 'owner' : 'editor';
  const permissions = parseAdminPermissions(payload.permissions, role);
  const expiresAt = typeof payload.exp === 'number' ? new Date(payload.exp * 1000).toISOString() : null;

  if (!email) {
    throw new Error('Token administrativo inválido.');
  }

  return {
    email,
    role,
    permissions,
    expiresAt,
  };
}
