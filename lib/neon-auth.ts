'use client';

import { createInternalNeonAuth } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  throw new Error('Defina NEXT_PUBLIC_NEON_AUTH_URL para usar a autenticação Neon.');
}

export const neonAuth = createInternalNeonAuth(authUrl, {
  adapter: BetterAuthReactAdapter(),
});

export async function getAdminAccessToken() {
  const attempts = 5;

  for (let index = 0; index < attempts; index += 1) {
    const token = await neonAuth.getJWTToken();

    if (token) {
      return token;
    }

    const refreshedSession = await neonAuth.adapter.getSession({ forceFetch: true });
    const refreshedToken = refreshedSession?.data?.session?.token ?? null;

    if (refreshedToken) {
      return refreshedToken;
    }

    if (index < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return null;
}
