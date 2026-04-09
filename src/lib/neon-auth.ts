import { createInternalNeonAuth } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  throw new Error('Defina VITE_NEON_AUTH_URL para usar a autenticação Neon.');
}

export const neonAuth = createInternalNeonAuth(authUrl, {
  adapter: BetterAuthReactAdapter(),
});

export async function getAdminAccessToken() {
  return neonAuth.getJWTToken();
}
