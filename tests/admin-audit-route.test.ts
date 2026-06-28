/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminContextFromRequest = vi.fn();
const listAuditLogs = vi.fn();

vi.mock('@/app/api/_lib/cms', () => ({
  listAuditLogs,
  requireAdminContextFromRequest,
}));

describe('admin audit route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'editor@ceis.pt', role: 'editor', permissions: ['news'] },
      error: null,
    });
    listAuditLogs.mockResolvedValue([
      {
        id: 'audit-1',
        createdAt: '2026-06-02T11:00:00.000Z',
        actorEmail: 'editor@ceis.pt',
        actorRole: 'editor',
        action: 'update',
        targetType: 'news',
        targetId: 'news-1',
        summary: 'Atualizou uma notícia.',
        before: null,
        after: null,
      },
    ]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('lists history for any authenticated backoffice admin', async () => {
    const { GET } = await import('@/app/api/admin/audit/route');

    const response = await GET(new Request('http://localhost/api/admin/audit') as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: 'audit-1',
        summary: 'Atualizou uma notícia.',
      }),
    ]);
    expect(listAuditLogs).toHaveBeenCalledTimes(1);
  });

  it('keeps blocking unauthenticated requests before reading history', async () => {
    requireAdminContextFromRequest.mockResolvedValue({
      context: null,
      error: Response.json({ message: 'Sessão administrativa expirada.' }, { status: 401 }),
    });

    const { GET } = await import('@/app/api/admin/audit/route');

    const response = await GET(new Request('http://localhost/api/admin/audit') as never);

    expect(response.status).toBe(401);
    expect(listAuditLogs).not.toHaveBeenCalled();
  });
});
