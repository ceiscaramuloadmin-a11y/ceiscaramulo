import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AdminPermission, AdminRole } from '@/types';
import { parseAdminPermissions } from '@/lib/admin-auth-shared';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';

type FirebaseAdminTokenClaims = DecodedIdToken & {
  ceiscaramuloRole?: unknown;
  ceiscaramuloPermissions?: unknown;
};

function normalizeRole(value: unknown): AdminRole {
  return value === 'owner' ? 'owner' : 'editor';
}

export async function verifyAdminSessionToken(token: string) {
  if (!token) {
    throw new Error('Sessão Firebase inválida ou em falta.');
  }

  const decoded = (await getFirebaseAdminAuth().verifyIdToken(token)) as FirebaseAdminTokenClaims;
  const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';

  if (!email) {
    throw new Error('A conta Firebase autenticada não expõe um email válido.');
  }

  const role = normalizeRole(decoded.ceiscaramuloRole);
  const permissions = parseAdminPermissions(decoded.ceiscaramuloPermissions, role);
  const expiresAt = typeof decoded.exp === 'number' ? new Date(decoded.exp * 1000).toISOString() : null;

  return {
    uid: decoded.uid,
    email,
    role,
    permissions: permissions as AdminPermission[],
    expiresAt,
    emailVerified: decoded.email_verified === true,
  };
}
