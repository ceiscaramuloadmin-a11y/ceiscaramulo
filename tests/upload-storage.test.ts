/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobGet = vi.fn();

vi.mock('@vercel/blob', () => ({
  get: blobGet,
}));

describe('upload storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_READ_WRITE_TOKEN = 'token';
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
});
