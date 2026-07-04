/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const handleUpload = vi.fn();
const requireAdminContextFromRequest = vi.fn();
const hasAdminPermission = vi.fn();

vi.mock('@vercel/blob/client', () => ({
  handleUpload,
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
    hasAdminPermission,
    requireAdminContextFromRequest,
  };
});

describe('content asset client upload route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'admin@ceis.pt', role: 'editor', permissions: ['publications'] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      const tokenConfig = await onBeforeGenerateToken(
        'backoffice/publications-media/video.mp4',
        JSON.stringify({ section: 'publications', kind: 'publication-attachment' })
      );

      return {
        type: 'blob.generate-client-token',
        clientToken: 'client-token',
        tokenConfig,
      };
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('generates direct Blob upload tokens for authorized content videos', async () => {
    const { POST } = await import('@/app/api/content-assets/client-upload/route');

    const response = await POST(
      new Request('http://localhost/api/content-assets/client-upload', {
        method: 'POST',
        body: JSON.stringify({ type: 'blob.generate-client-token', payload: {} }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(hasAdminPermission).toHaveBeenCalledWith(
      { email: 'admin@ceis.pt', role: 'editor', permissions: ['publications'] },
      'publications'
    );
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        clientToken: 'client-token',
        tokenConfig: expect.objectContaining({
          addRandomSuffix: false,
          allowedContentTypes: expect.arrayContaining([
            'image/png',
            'video/mp4',
            'video/quicktime',
            'audio/mpeg',
            'application/pdf',
          ]),
        }),
      })
    );
  });

  it('rejects tokens for invalid content sections', async () => {
    handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      await onBeforeGenerateToken('backoffice/unknown/video.mp4', JSON.stringify({ section: 'unknown', kind: 'video' }));
    });

    const { POST } = await import('@/app/api/content-assets/client-upload/route');

    const response = await POST(
      new Request('http://localhost/api/content-assets/client-upload', {
        method: 'POST',
        body: JSON.stringify({ type: 'blob.generate-client-token', payload: {} }),
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Seccao invalida para upload.',
    });
  });
});
