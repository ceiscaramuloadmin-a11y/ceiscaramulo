/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobDel = vi.fn();
const blobGet = vi.fn();

vi.mock('@vercel/blob', () => ({
  del: blobDel,
  get: blobGet,
}));

describe('upload storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_READ_WRITE_TOKEN = 'token';
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
  });

  it('tries private Blob uploads before falling back to public Blob uploads', async () => {
    blobGet.mockResolvedValueOnce(null).mockResolvedValueOnce({
      statusCode: 200,
      stream: new Blob(['ok']).stream(),
      blob: {
        contentType: 'image/jpeg',
        size: 2,
      },
    });

    const { getPrivateBlobUpload } = await import('@/lib/upload-storage');
    const result = await getPrivateBlobUpload('activities/file.jpg');

    expect(result?.statusCode).toBe(200);
    expect(blobGet).toHaveBeenNthCalledWith(1, 'backoffice/activities/file.jpg', {
      access: 'private',
      token: 'token',
    });
    expect(blobGet).toHaveBeenNthCalledWith(2, 'backoffice/activities/file.jpg', {
      access: 'public',
      token: 'token',
    });
  });

  it('deletes only normalized backoffice Blob upload paths', async () => {
    const { deleteBackofficeBlobUpload, getBackofficeBlobPathFromUploadValue } = await import('@/lib/upload-storage');

    expect(getBackofficeBlobPathFromUploadValue('/uploads/backoffice/gallery-pon-do-jueus/foto.png')).toBe(
      'backoffice/gallery-pon-do-jueus/foto.png'
    );
    expect(
      getBackofficeBlobPathFromUploadValue(
        'https://store.public.blob.vercel-storage.com/backoffice/gallery-global/foto.webp'
      )
    ).toBe('backoffice/gallery-global/foto.webp');
    expect(getBackofficeBlobPathFromUploadValue('https://example.com/other/foto.webp')).toBeNull();
    expect(getBackofficeBlobPathFromUploadValue('/uploads/backoffice/../secret.txt')).toBeNull();

    await expect(deleteBackofficeBlobUpload('/uploads/backoffice/gallery-pon-do-jueus/foto.png')).resolves.toBe(true);
    await expect(deleteBackofficeBlobUpload('https://example.com/other/foto.webp')).resolves.toBe(false);

    expect(blobDel).toHaveBeenCalledTimes(1);
    expect(blobDel).toHaveBeenCalledWith('backoffice/gallery-pon-do-jueus/foto.png', { token: 'token' });
  });
});
