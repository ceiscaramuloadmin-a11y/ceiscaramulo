/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const handleUpload = vi.fn();
const requireAdminContextFromRequest = vi.fn();
const hasAdminPermission = vi.fn();

vi.mock('@vercel/blob/client', () => ({
  handleUpload,
}));

vi.mock('@/app/api/_lib/cms', () => ({
  hasAdminPermission,
  requireAdminContextFromRequest,
}));

describe('gallery client upload route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'admin@ceis.pt', role: 'editor', permissions: ['gallery'] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      const tokenConfig = await onBeforeGenerateToken('backoffice/gallery/file.mp4');
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

  it('generates client upload tokens for authorized gallery admins', async () => {
    const { POST } = await import('@/app/api/gallery/client-upload/route');

    const response = await POST(
      new Request('http://localhost/api/gallery/client-upload', {
        method: 'POST',
        body: JSON.stringify({ type: 'blob.generate-client-token', payload: {} }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(hasAdminPermission).toHaveBeenCalledWith(
      { email: 'admin@ceis.pt', role: 'editor', permissions: ['gallery'] },
      'gallery'
    );
    expect(handleUpload).toHaveBeenCalledTimes(1);
    expect(handleUpload).toHaveBeenCalledWith(expect.not.objectContaining({ onUploadCompleted: expect.any(Function) }));
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        clientToken: 'client-token',
        tokenConfig: expect.objectContaining({
          addRandomSuffix: false,
          maximumSizeInBytes: 500 * 1024 * 1024,
          allowedContentTypes: expect.arrayContaining([
            'image/png',
            'video/mp4',
            'audio/mpeg',
            'application/pdf',
          ]),
        }),
      })
    );
  });

  it('rejects client upload tokens when the admin cannot manage gallery media', async () => {
    hasAdminPermission.mockReturnValue(false);

    const { POST } = await import('@/app/api/gallery/client-upload/route');

    const response = await POST(
      new Request('http://localhost/api/gallery/client-upload', {
        method: 'POST',
        body: JSON.stringify({ type: 'blob.generate-client-token', payload: {} }),
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Sem permissao para carregar media da galeria.',
    });
  });
});
