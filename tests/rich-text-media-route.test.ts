/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requireAdminContextFromRequest,
  hasAdminPermission,
  storeUploadedFile,
} = vi.hoisted(() => ({
  requireAdminContextFromRequest: vi.fn(),
  hasAdminPermission: vi.fn(),
  storeUploadedFile: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {},
}));

vi.mock('@/app/api/_lib/cms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/api/_lib/cms')>();
  return {
    ...actual,
    requireAdminContextFromRequest,
    hasAdminPermission,
    storeUploadedFile,
  };
});

describe('rich text media upload route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: [] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    storeUploadedFile.mockResolvedValue('/uploads/backoffice/rich-text-news-audio/audio.mp3');
  });

  it('stores news editor audio as an upload URL instead of inline content', async () => {
    const { POST } = await import('@/app/api/content-assets/rich-text/route');
    const formData = new FormData();
    const file = new File(['audio'], 'audio.mp3', { type: 'audio/mpeg' });

    formData.set('section', 'news');
    formData.set('kind', 'audio');
    formData.set('file', file);

    const response = await POST(
      new NextRequest('http://localhost/api/content-assets/rich-text', {
        method: 'POST',
        body: formData,
      })
    );

    await expect(response.json()).resolves.toEqual({
      url: '/uploads/backoffice/rich-text-news-audio/audio.mp3',
    });
    expect(storeUploadedFile).toHaveBeenCalledWith(file, 'rich-text-news-audio');
  });

  it('stores news editor images as public upload URLs for the frontend body', async () => {
    storeUploadedFile.mockResolvedValueOnce('/uploads/backoffice/rich-text-news-image/foto.png');

    const { POST } = await import('@/app/api/content-assets/rich-text/route');
    const formData = new FormData();
    const file = new File(['image'], 'foto.png', { type: 'image/png' });

    formData.set('section', 'news');
    formData.set('kind', 'image');
    formData.set('file', file);

    const response = await POST(
      new NextRequest('http://localhost/api/content-assets/rich-text', {
        method: 'POST',
        body: formData,
      })
    );

    await expect(response.json()).resolves.toEqual({
      url: '/uploads/backoffice/rich-text-news-image/foto.png',
    });
    expect(storeUploadedFile).toHaveBeenCalledWith(file, 'rich-text-news-image');
  });

  it('rejects media that does not match the declared kind', async () => {
    const { POST } = await import('@/app/api/content-assets/rich-text/route');
    const formData = new FormData();

    formData.set('section', 'news');
    formData.set('kind', 'audio');
    formData.set('file', new File(['image'], 'image.png', { type: 'image/png' }));

    const response = await POST(
      new NextRequest('http://localhost/api/content-assets/rich-text', {
        method: 'POST',
        body: formData,
      })
    );

    expect(response.status).toBe(400);
    expect(storeUploadedFile).not.toHaveBeenCalled();
  });
});
