/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const newsCount = vi.fn();
const activityCount = vi.fn();
const projectCount = vi.fn();
const publicationCount = vi.fn();
const contactMessageCount = vi.fn();
const listGalleryMedia = vi.fn();
const requireAdminFromRequest = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    news: { count: newsCount },
    activity: { count: activityCount },
    project: { count: projectCount },
    publication: { count: publicationCount },
    contactMessage: { count: contactMessageCount },
  },
}));

vi.mock('@/app/api/_lib/cms', () => ({
  listGalleryMedia,
  requireAdminFromRequest,
}));

describe('admin stats route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequest.mockResolvedValue(null);
    newsCount.mockResolvedValue(6);
    activityCount.mockResolvedValue(7);
    projectCount.mockResolvedValue(0);
    publicationCount.mockResolvedValue(3);
    contactMessageCount.mockResolvedValue(1);
    listGalleryMedia.mockImplementation(async (_scope: 'admin', context: string) => {
      if (context === 'artigos-para-venda') {
        return [{ id: 'sale-1' }, { id: 'sale-2' }];
      }

      if (context === 'biblioteca-jrs') {
        return [{ id: 'jrs-1' }];
      }

      return [];
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns dashboard totals and page media counts for the overview cards', async () => {
    const { GET } = await import('@/app/api/admin/stats/route');

    const response = await GET(new Request('http://localhost/api/admin/stats') as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      news: 6,
      activities: 7,
      projects: 0,
      publications: 3,
      contacts: 1,
      galleryByContext: {
        'oficina-do-burel': 0,
        'artigos-para-venda': 2,
        'biblioteca-jrs': 1,
        'pon-do-jueus': 0,
        'escola-dos-nossos-avos': 0,
        'oficinas-de-formacao': 0,
        publicacoes: 0,
        biblioteca: 0,
      },
    });
    expect(listGalleryMedia).toHaveBeenCalledWith('admin', 'artigos-para-venda');
    expect(listGalleryMedia).toHaveBeenCalledWith('admin', 'biblioteca-jrs');
  });
});
