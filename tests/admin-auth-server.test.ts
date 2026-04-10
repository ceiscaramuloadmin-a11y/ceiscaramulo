/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe('admin-auth-server', () => {
  it('rejects invalid credentials', async () => {
    process.env.ADMIN_AUTH_PASSWORD = 'super-secret';

    const { validateAdminCredentials } = await import('@/lib/admin-auth-server');

    expect(() => validateAdminCredentials({ email: 'admin@ceis.pt', password: 'wrong' })).toThrow(
      'Credenciais administrativas inválidas.'
    );
  });

  it('creates and verifies signed admin tokens', async () => {
    process.env.ADMIN_AUTH_PASSWORD = 'super-secret';
    process.env.ADMIN_AUTH_SECRET = 'test-secret';

    const { createAdminSessionToken, verifyAdminSessionToken } = await import('@/lib/admin-auth-server');

    const { token } = await createAdminSessionToken({
      email: 'admin@ceis.pt',
      role: 'editor',
      permissions: ['news', 'gallery'],
    });

    await expect(verifyAdminSessionToken(token)).resolves.toMatchObject({
      email: 'admin@ceis.pt',
      role: 'editor',
      permissions: ['news', 'gallery'],
    });
  });
});
