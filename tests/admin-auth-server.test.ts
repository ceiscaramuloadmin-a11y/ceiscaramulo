/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession,
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('admin-auth-server', () => {
  it('rejects a missing Auth0 session', async () => {
    getSession.mockResolvedValue(null);
    const { getAdminAuthSession } = await import('@/lib/admin-auth-server');

    await expect(getAdminAuthSession(new Request('http://localhost') as never)).rejects.toThrow('Sessão Auth0 inválida ou em falta.');
  });

  it('normalizes the Auth0 session payload', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|firebase-uid',
        email: 'Admin@Ceis.pt',
        email_verified: true,
      },
      tokenSet: {
        accessToken: 'token',
        expiresAt: 4102444800,
      },
    });

    const { getAdminAuthSession } = await import('@/lib/admin-auth-server');

    await expect(getAdminAuthSession(new Request('http://localhost') as never)).resolves.toMatchObject({
      uid: 'auth0|firebase-uid',
      email: 'admin@ceis.pt',
      emailVerified: true,
      expiresAt: '2100-01-01T00:00:00.000Z',
    });
  });
});
