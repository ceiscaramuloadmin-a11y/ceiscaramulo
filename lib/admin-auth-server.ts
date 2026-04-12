import type { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function getAdminAuthSession(request: NextRequest) {
  const session = await auth0.getSession(request);

  if (!session) {
    throw new Error('Sessão Auth0 inválida ou em falta.');
  }

  const email = typeof session.user.email === 'string' ? session.user.email.trim().toLowerCase() : '';

  if (!email) {
    throw new Error('A conta Auth0 autenticada não expõe um email válido.');
  }

  const expiresAt =
    typeof session.tokenSet?.expiresAt === 'number' ? new Date(session.tokenSet.expiresAt * 1000).toISOString() : null;

  return {
    uid: String(session.user.sub),
    email,
    expiresAt,
    emailVerified: session.user.email_verified === true,
    user: session.user,
  };
}
