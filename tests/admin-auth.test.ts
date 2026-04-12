/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('admin auth runtime mode', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_AUTH_MODE', 'runtime');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns an Auth0 guidance error when runtime sign-in is attempted with email/password', async () => {
    const { adminAuthClient } = await import('@/lib/admin-auth');

    await expect(
      adminAuthClient.adapter.signIn.email({
        email: 'admin@ceis.pt',
        password: 'segredo',
      })
    ).resolves.toEqual({
      data: null,
      error: {
        message: 'O login administrativo runtime passou a usar Auth0. Use o botão "Entrar com Auth0".',
      },
    });
  });
});
