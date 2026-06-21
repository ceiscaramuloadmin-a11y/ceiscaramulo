/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requireAdminContextFromRequest,
  hasAdminPermission,
  storeUploadedFile,
  fileToDataUrl,
} = vi.hoisted(() => ({
  requireAdminContextFromRequest: vi.fn(),
  hasAdminPermission: vi.fn(),
  storeUploadedFile: vi.fn(),
  fileToDataUrl: vi.fn(),
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
    fileToDataUrl,
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
    fileToDataUrl.mockResolvedValue('data:image/png;base64,aW1hZ2U=');
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

  it('embeds news editor images inline so frontend body images cannot 404', async () => {
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
      url: 'data:image/png;base64,aW1hZ2U=',
    });
    expect(fileToDataUrl).toHaveBeenCalledWith(file);
    expect(storeUploadedFile).not.toHaveBeenCalled();
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
