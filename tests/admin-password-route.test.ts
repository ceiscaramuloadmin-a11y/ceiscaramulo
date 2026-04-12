/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminContextFromRequest = vi.fn();
const getAdminAuthSession = vi.fn();
const updateAuth0UserPassword = vi.fn();

vi.mock('@/app/api/_lib/cms', () => ({
  requireAdminContextFromRequest,
}));

vi.mock('@/lib/admin-auth-server', () => ({
  getAdminAuthSession,
}));

vi.mock('@/lib/auth0-management', () => ({
  updateAuth0UserPassword,
}));

describe('admin password route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: ['admins'] },
      error: null,
    });
    getAdminAuthSession.mockResolvedValue({
      uid: 'auth0|owner-1',
      email: 'owner@ceis.pt',
    });
    updateAuth0UserPassword.mockResolvedValue(undefined);
  });

  it('updates the logged-in admin password in Auth0', async () => {
    const { POST } = await import('@/app/api/admin/password/route');

    const response = await POST(
      new Request('http://localhost/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'NovaSenha123!',
          confirmPassword: 'NovaSenha123!',
        }),
      }) as never
    );

    expect(updateAuth0UserPassword).toHaveBeenCalledWith('auth0|owner-1', 'NovaSenha123!');
    expect(response.status).toBe(200);
  });

  it('rejects mismatched password confirmation', async () => {
    const { POST } = await import('@/app/api/admin/password/route');

    const response = await POST(
      new Request('http://localhost/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'NovaSenha123!',
          confirmPassword: 'OutraSenha123!',
        }),
      }) as never
    );

    expect(updateAuth0UserPassword).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'A confirmação da palavra-passe não coincide.',
    });
  });
});
