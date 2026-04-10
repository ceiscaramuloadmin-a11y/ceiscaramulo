/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const validateAdminCredentials = vi.fn();
const createAdminSessionToken = vi.fn();
const getAdminByEmail = vi.fn();
const listAdminUsers = vi.fn();
const saveAdminUsers = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));

vi.mock('@/lib/admin-auth-server', () => ({
  validateAdminCredentials,
  createAdminSessionToken,
}));

vi.mock('@/app/api/_lib/cms', () => ({
  getAdminByEmail,
  listAdminUsers,
  saveAdminUsers,
  jsonError,
}));

describe('admin session route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns a signed session for an active admin', async () => {
    validateAdminCredentials.mockReturnValue({ email: 'admin@ceis.pt' });
    getAdminByEmail.mockResolvedValue({
      email: 'admin@ceis.pt',
      role: 'owner',
      permissions: ['news', 'admins'],
      active: true,
    });
    createAdminSessionToken.mockResolvedValue({
      token: 'signed-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@ceis.pt', password: 'segredo' }),
      }) as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      token: 'signed-token',
      session: {
        email: 'admin@ceis.pt',
        role: 'owner',
        permissions: ['news', 'admins'],
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    });
  });

  it('bootstraps the first admin when the admin list is empty', async () => {
    validateAdminCredentials.mockReturnValue({ email: 'first@ceis.pt' });
    getAdminByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({
      email: 'first@ceis.pt',
      role: 'owner',
      permissions: ['news', 'activities', 'projects', 'publications', 'gallery', 'layout', 'admins', 'audit'],
      active: true,
    });
    listAdminUsers.mockResolvedValue([]);
    saveAdminUsers.mockResolvedValue(undefined);
    createAdminSessionToken.mockResolvedValue({
      token: 'bootstrap-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
        body: JSON.stringify({ email: 'first@ceis.pt', password: 'segredo' }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(saveAdminUsers).toHaveBeenCalledTimes(1);
  });

  it('returns a 401 payload when authentication fails', async () => {
    validateAdminCredentials.mockImplementation(() => {
      throw new Error('Credenciais administrativas inválidas.');
    });

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
        body: JSON.stringify({ email: 'x', password: 'y' }),
      }) as never
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Credenciais administrativas inválidas.' });
  });
});
