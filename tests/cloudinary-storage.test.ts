/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const cloudinaryConfig = vi.fn();
const destroy = vi.fn();
const uploadStream = vi.fn();
const apiSignRequest = vi.fn();

vi.mock('cloudinary', () => ({
  v2: {
    config: cloudinaryConfig,
    uploader: {
      destroy,
      upload_stream: uploadStream,
    },
    utils: {
      api_sign_request: apiSignRequest,
    },
  },
}));

describe('cloudinary storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = 'api-key';
    process.env.CLOUDINARY_API_SECRET = 'api-secret';
    uploadStream.mockImplementation((options, callback) => ({
      end: () => callback(null, { secure_url: `https://res.cloudinary.com/demo/image/upload/${options.public_id}.png` }),
    }));
    destroy.mockResolvedValue({ result: 'ok' });
    apiSignRequest.mockReturnValue('signed');
  });

  it('uploads backoffice files with stable Cloudinary public IDs', async () => {
    const { uploadBufferToCloudinary } = await import('@/lib/cloudinary-storage');

    const result = await uploadBufferToCloudinary({
      relativePath: 'gallery-pon-do-jueus/foto-final.png',
      buffer: Buffer.from('image'),
      contentType: 'image/png',
    });

    expect(result).toEqual({
      publicUrl: 'https://res.cloudinary.com/demo/image/upload/backoffice/gallery-pon-do-jueus/foto-final.png',
      storageValue: 'cloudinary:https://res.cloudinary.com/demo/image/upload/backoffice/gallery-pon-do-jueus/foto-final.png',
    });
    expect(cloudinaryConfig).toHaveBeenCalledWith({
      cloud_name: 'demo-cloud',
      api_key: 'api-key',
      api_secret: 'api-secret',
      secure: true,
    });
    expect(uploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        public_id: 'backoffice/gallery-pon-do-jueus/foto-final',
        resource_type: 'auto',
        overwrite: true,
      }),
      expect.any(Function)
    );
  });

  it('creates signed direct-upload parameters without exposing the api secret', async () => {
    const { createCloudinaryUploadSignature } = await import('@/lib/cloudinary-storage');

    const signature = createCloudinaryUploadSignature({ relativePath: 'gallery/foto.jpg' });

    expect(signature).toEqual({
      cloudName: 'demo-cloud',
      apiKey: 'api-key',
      timestamp: expect.any(Number),
      publicId: 'backoffice/gallery/foto',
      overwrite: 'true',
      signature: 'signed',
    });
    expect(apiSignRequest).toHaveBeenCalledWith(
      {
        overwrite: 'true',
        public_id: 'backoffice/gallery/foto',
        timestamp: signature.timestamp,
      },
      'api-secret'
    );
    expect(JSON.stringify(signature)).not.toContain('api-secret');
  });

  it('extracts Cloudinary URLs from migrated storage values', async () => {
    const { cloudinaryPublicIdFromUrl, cloudinaryUrlFromStorageValue } = await import('@/lib/cloudinary-storage');

    expect(cloudinaryUrlFromStorageValue('cloudinary:https://res.cloudinary.com/demo/image/upload/foto.png')).toBe(
      'https://res.cloudinary.com/demo/image/upload/foto.png'
    );
    expect(cloudinaryUrlFromStorageValue('https://res.cloudinary.com/demo/image/upload/foto.png')).toBe(
      'https://res.cloudinary.com/demo/image/upload/foto.png'
    );
    expect(cloudinaryUrlFromStorageValue('https://example.com/foto.png')).toBeNull();
    expect(
      cloudinaryPublicIdFromUrl('https://res.cloudinary.com/demo/image/upload/v123/backoffice/news/foto.png')
    ).toBe('backoffice/news/foto');
  });

  it('deletes Cloudinary uploads by parsed public ID', async () => {
    const { deleteCloudinaryUpload } = await import('@/lib/cloudinary-storage');

    await expect(
      deleteCloudinaryUpload('https://res.cloudinary.com/demo/image/upload/v123/backoffice/news/foto.png')
    ).resolves.toBe(true);

    expect(destroy).toHaveBeenCalledWith('backoffice/news/foto', {
      resource_type: 'image',
      invalidate: true,
    });
  });
});
