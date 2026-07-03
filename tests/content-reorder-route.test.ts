/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAdminContextFromRequest, hasAdminPermission, newsUpdate, activityUpdate, appendAuditLog } = vi.hoisted(() => ({
  requireAdminContextFromRequest: vi.fn(),
  hasAdminPermission: vi.fn(),
  newsUpdate: vi.fn(),
  activityUpdate: vi.fn(),
  appendAuditLog: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    news: { update: newsUpdate },
    activity: { update: activityUpdate },
    project: {},
    publication: {},
  },
}));

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/app/api/_lib/cms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/api/_lib/cms')>();

  return {
    ...actual,
    appendAuditLog,
    hasAdminPermission,
    requireAdminContextFromRequest,
  };
});

describe('content reorder route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'admin@ceis.pt', role: 'editor', permissions: ['news', 'activities'] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    newsUpdate.mockResolvedValue({});
    activityUpdate.mockResolvedValue({});
  });

  it('updates compact sortOrder values for news items', async () => {
    const { POST } = await import('@/app/api/[section]/reorder/route');
    const response = await POST(
      new NextRequest('http://localhost/api/news/reorder', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            { id: 'news-2', sortOrder: 1 },
            { id: 'news-1', sortOrder: 2 },
          ],
        }),
      }),
      { params: Promise.resolve({ section: 'news' }) }
    );

    expect(response.status).toBe(200);
    expect(newsUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'news-2' },
      data: { sortOrder: 1 },
    });
    expect(newsUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'news-1' },
      data: { sortOrder: 2 },
    });
    expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'reorder',
      targetType: 'news',
    }));
  });

  it('rejects non-reorderable content sections', async () => {
    const { POST } = await import('@/app/api/[section]/reorder/route');
    const response = await POST(
      new NextRequest('http://localhost/api/publications/reorder', {
        method: 'POST',
        body: JSON.stringify({ items: [{ id: 'publication-1', sortOrder: 1 }] }),
      }),
      { params: Promise.resolve({ section: 'publications' }) }
    );

    expect(response.status).toBe(404);
    expect(newsUpdate).not.toHaveBeenCalled();
    expect(activityUpdate).not.toHaveBeenCalled();
  });
});
