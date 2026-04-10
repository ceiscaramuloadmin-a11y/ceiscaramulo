/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const verifyIdToken = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdminAuth: () => ({
    verifyIdToken,
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('admin-auth-server', () => {
  it('rejects an empty Firebase token', async () => {
    const { verifyAdminSessionToken } = await import('@/lib/admin-auth-server');

    await expect(verifyAdminSessionToken('')).rejects.toThrow('Sessão Firebase inválida ou em falta.');
  });

  it('verifies Firebase ID tokens and normalizes the admin session payload', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'firebase-uid',
      email: 'Admin@Ceis.pt',
      exp: 4102444800,
      email_verified: true,
      ceiscaramuloRole: 'editor',
      ceiscaramuloPermissions: ['news', 'gallery'],
    });

    const { verifyAdminSessionToken } = await import('@/lib/admin-auth-server');

    await expect(verifyAdminSessionToken('firebase-token')).resolves.toMatchObject({
      uid: 'firebase-uid',
      email: 'admin@ceis.pt',
      role: 'editor',
      permissions: ['news', 'gallery'],
      emailVerified: true,
    });
  });
});
