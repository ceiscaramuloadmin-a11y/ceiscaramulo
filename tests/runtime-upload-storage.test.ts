/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { siteSettingFindUnique, siteSettingUpsert } = vi.hoisted(() => ({
  siteSettingFindUnique: vi.fn(),
  siteSettingUpsert: vi.fn(),
}));

const { blobPut } = vi.hoisted(() => ({
  blobPut: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    siteSetting: {
      findUnique: siteSettingFindUnique,
      upsert: siteSettingUpsert,
    },
  },
}));

vi.mock('@vercel/blob', () => ({
  put: blobPut,
}));

describe('runtime upload storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    siteSettingUpsert.mockResolvedValue({});
    blobPut.mockResolvedValue({ url: 'https://blob.vercel-storage.com/backoffice/news-fotos/foto.png' });
  });

  it('stores uploads in site settings instead of writing to public at runtime', async () => {
    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toMatch(/^\/uploads\/backoffice\/news-fotos\/.+\.png$/);
    expect(siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/) },
      create: {
        key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/),
        value: 'data:image/png;base64,aGVsbG8=',
      },
      update: { value: 'data:image/png;base64,aGVsbG8=' },
    });
  });

  it('stores uploads in Vercel Blob when the production token is configured', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.BLOB_READ_WRITE_TOKEN = 'token';

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toBe('https://blob.vercel-storage.com/backoffice/news-fotos/foto.png');
    expect(blobPut).toHaveBeenCalledWith(
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        token: 'token',
      }
    );
    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('stores uploads with Vercel OIDC when no read-write token is injected', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.VERCEL_OIDC_TOKEN = 'oidc-token';
    process.env.VERCEL = '1';

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toBe('https://blob.vercel-storage.com/backoffice/news-fotos/foto.png');
    expect(blobPut).toHaveBeenCalledWith(
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        oidcToken: 'oidc-token',
      }
    );
    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('falls back to private Blob uploads when the store is private', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.BLOB_READ_WRITE_TOKEN = 'token';
    blobPut
      .mockRejectedValueOnce(new Error('Vercel Blob: Cannot use public access on a private store.'))
      .mockResolvedValueOnce({ url: 'https://private.blob.vercel-storage.com/backoffice/news-fotos/foto.png' });

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toMatch(/^\/uploads\/backoffice\/news-fotos\/.+\.png$/);
    const storedKey = expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/);
    expect(blobPut).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        token: 'token',
      }
    );
    expect(blobPut).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        token: 'token',
      }
    );
    const privateBlobPath = (blobPut.mock.calls[1]?.[0] as string).replace(/^backoffice\//, '');
    expect(siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: storedKey },
      create: {
        key: storedKey,
        value: `blob-private:${privateBlobPath}`,
      },
      update: { value: `blob-private:${privateBlobPath}` },
    });
    expect(siteSettingUpsert.mock.calls[0]?.[0].create.value).not.toContain('base64');
  });

  it('reads private Blob markers from upload metadata', async () => {
    const { getStoredUploadedFile } = await import('@/app/api/_lib/cms');
    siteSettingFindUnique.mockResolvedValueOnce({ value: 'blob-private:news/file.png' });

    await expect(getStoredUploadedFile(['news', 'file.png'])).resolves.toBe('blob-private:news/file.png');
    expect(siteSettingFindUnique).toHaveBeenCalledWith({
      where: { key: 'upload:backoffice:news/file.png' },
    });
  });

  it('does not store database metadata for public Blob uploads', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.BLOB_READ_WRITE_TOKEN = 'token';

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    await storeUploadedFile(file, 'News Fotos');

    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('does not overload the database with uploads on hosted deployments without Blob configured', async () => {
    process.env.VERCEL = '1';
    blobPut.mockRejectedValueOnce(new Error('Vercel Blob: No blob credentials found.'));

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    await expect(storeUploadedFile(file, 'News Fotos')).rejects.toThrow('alojamento não está a disponibilizar');
    expect(blobPut).toHaveBeenCalledWith(
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/png',
      }
    );
    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('reads only normalized backoffice upload paths', async () => {
    const { getStoredUploadedFile } = await import('@/app/api/_lib/cms');
    siteSettingFindUnique.mockResolvedValueOnce({ value: 'data:text/plain;base64,b2s=' });

    await expect(getStoredUploadedFile(['news', 'file.txt'])).resolves.toBe('data:text/plain;base64,b2s=');
    expect(siteSettingFindUnique).toHaveBeenCalledWith({
      where: { key: 'upload:backoffice:news/file.txt' },
    });

    await expect(getStoredUploadedFile(['..', 'secret.txt'])).resolves.toBeNull();
  });
});
