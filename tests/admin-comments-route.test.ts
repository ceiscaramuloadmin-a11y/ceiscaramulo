/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { findMany, findUnique, deleteComment, requireAdminContextFromRequest, hasAdminPermission, appendAuditLog } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  deleteComment: vi.fn(),
  requireAdminContextFromRequest: vi.fn(),
  hasAdminPermission: vi.fn(),
  appendAuditLog: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    contentComment: { findMany, findUnique, delete: deleteComment },
    news: { findUnique: vi.fn().mockResolvedValue({ title: 'Notícia teste' }) },
    activity: { findUnique: vi.fn().mockResolvedValue({ title: 'Atividade teste' }) },
    publication: { findUnique: vi.fn().mockResolvedValue({ title: 'Recurso teste' }) },
  },
}));

vi.mock('@/app/api/_lib/cms', () => ({
  appendAuditLog,
  hasAdminPermission,
  jsonError: (message: string, status = 400) => Response.json({ message }, { status }),
  requireAdminContextFromRequest,
}));

describe('admin comments route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'admin@ceis.pt', role: 'editor', permissions: ['news'] },
      error: null,
    });
    hasAdminPermission.mockImplementation((_context, permission) => permission === 'news');
  });

  it('lists comments for manageable public content with content titles', async () => {
    findMany.mockResolvedValue([
      { id: 'c1', contentType: 'news', contentId: 'n1', name: 'Ana', email: 'ana@test.pt', message: 'Olá', createdAt: new Date('2026-07-01') },
    ]);

    const { GET } = await import('@/app/api/admin/comments/route');
    const response = await GET(new NextRequest('http://localhost/api/admin/comments?limit=20') as never);

    expect(response.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { contentType: { in: ['news', 'activities', 'publications'] } },
      take: 20,
    }));
    await expect(response.json()).resolves.toMatchObject([{ id: 'c1', contentTitle: 'Notícia teste' }]);
  });

  it('deletes a comment and writes a compact audit entry', async () => {
    const current = { id: 'c1', contentType: 'news', contentId: 'n1', name: 'Ana', email: 'ana@test.pt', message: 'Spam', createdAt: new Date() };
    findUnique.mockResolvedValue(current);
    deleteComment.mockResolvedValue(current);

    const { DELETE } = await import('@/app/api/admin/comments/route');
    const response = await DELETE(new NextRequest('http://localhost/api/admin/comments?id=c1') as never);

    expect(response.status).toBe(204);
    expect(deleteComment).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'comment_delete',
      targetType: 'content_comment',
      targetId: 'c1',
    }));
  });
});
