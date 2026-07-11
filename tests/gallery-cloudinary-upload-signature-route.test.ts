/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminContextFromRequest = vi.fn();
const hasAdminPermission = vi.fn();
const createCloudinaryUploadSignature = vi.fn();

vi.mock('@/app/api/_lib/cms', () => ({
  hasAdminPermission,
  requireAdminContextFromRequest,
}));

vi.mock('@/lib/cloudinary-storage', () => ({
  createCloudinaryUploadSignature,
}));

describe('gallery Cloudinary upload signature route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'admin@ceis.pt', role: 'editor', permissions: ['gallery'] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    createCloudinaryUploadSignature.mockReturnValue({
      cloudName: 'demo-cloud',
      apiKey: 'api-key',
      timestamp: 123,
      publicId: 'backoffice/gallery/foto',
      overwrite: 'true',
      signature: 'signed',
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('generates signed Cloudinary upload parameters for authorized gallery admins', async () => {
    const { POST } = await import('@/app/api/gallery/cloudinary-upload-signature/route');

    const response = await POST(
      new Request('http://localhost/api/gallery/cloudinary-upload-signature', {
        method: 'POST',
        body: JSON.stringify({ relativePath: 'gallery-pon-do-jueus/foto.png' }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(hasAdminPermission).toHaveBeenCalledWith(
      { email: 'admin@ceis.pt', role: 'editor', permissions: ['gallery'] },
      'gallery'
    );
    expect(createCloudinaryUploadSignature).toHaveBeenCalledWith({
      relativePath: 'gallery-pon-do-jueus/foto.png',
    });
    await expect(response.json()).resolves.toEqual({
      cloudName: 'demo-cloud',
      apiKey: 'api-key',
      timestamp: 123,
      publicId: 'backoffice/gallery/foto',
      overwrite: 'true',
      signature: 'signed',
    });
  });

  it('rejects signatures when the admin cannot manage gallery media', async () => {
    hasAdminPermission.mockReturnValue(false);

    const { POST } = await import('@/app/api/gallery/cloudinary-upload-signature/route');

    const response = await POST(
      new Request('http://localhost/api/gallery/cloudinary-upload-signature', {
        method: 'POST',
        body: JSON.stringify({ relativePath: 'gallery/foto.png' }),
      }) as never
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: 'Sem permissao para carregar media da galeria.',
    });
  });

  it('rejects unsafe relative paths before signing', async () => {
    const { POST } = await import('@/app/api/gallery/cloudinary-upload-signature/route');

    const response = await POST(
      new Request('http://localhost/api/gallery/cloudinary-upload-signature', {
        method: 'POST',
        body: JSON.stringify({ relativePath: '../secret.png' }),
      }) as never
    );

    expect(response.status).toBe(400);
    expect(createCloudinaryUploadSignature).not.toHaveBeenCalled();
  });
});
