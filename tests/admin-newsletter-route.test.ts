/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { findMany, requireAdminContextFromRequest, hasAdminPermission } = vi.hoisted(() => ({
  findMany: vi.fn(),
  requireAdminContextFromRequest: vi.fn(),
  hasAdminPermission: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    newsletterSubscriber: { findMany },
  },
}));

vi.mock('@/app/api/_lib/cms', () => ({
  hasAdminPermission,
  jsonError: (message: string, status = 400) => Response.json({ message }, { status }),
  requireAdminContextFromRequest,
}));

describe('admin newsletter route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'admin@ceis.pt', role: 'editor', permissions: ['contacts'] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    findMany.mockResolvedValue([
      { id: 's1', email: 'ana@test.pt', createdAt: new Date('2026-07-01T10:00:00.000Z') },
    ]);
  });

  it('lists newsletter subscribers for contact admins', async () => {
    const { GET } = await import('@/app/api/admin/newsletter/route');
    const response = await GET(new NextRequest('http://localhost/api/admin/newsletter?limit=50') as never);

    expect(response.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    await expect(response.json()).resolves.toEqual([
      { id: 's1', email: 'ana@test.pt', createdAt: '2026-07-01T10:00:00.000Z' },
    ]);
  });

  it('exports newsletter subscribers as csv', async () => {
    const { GET } = await import('@/app/api/admin/newsletter/route');
    const response = await GET(new NextRequest('http://localhost/api/admin/newsletter?format=csv') as never);

    expect(response.headers.get('content-type')).toContain('text/csv');
    await expect(response.text()).resolves.toContain('ana@test.pt,2026-07-01T10:00:00.000Z');
  });
});
