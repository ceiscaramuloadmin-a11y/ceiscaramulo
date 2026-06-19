import { get, put } from '@vercel/blob';

type PublicUploadInput = {
  relativePath: string;
  buffer: Buffer;
  contentType: string;
};

export function isBlobUploadStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function getBlobUploadOptions() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();

  return {
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
  };
}

function isHostedRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function isPrivateStoreAccessError(error: unknown) {
  return String(error instanceof Error ? error.message : error).includes('Cannot use public access on a private store');
}

export async function storePublicUpload(input: PublicUploadInput) {
  if (isBlobUploadStorageEnabled()) {
    try {
      const blob = await put(`backoffice/${input.relativePath}`, input.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: input.contentType,
        ...getBlobUploadOptions(),
      });

      return blob.url;
    } catch (error) {
      if (!isPrivateStoreAccessError(error)) {
        throw error;
      }

      await put(`backoffice/${input.relativePath}`, input.buffer, {
        access: 'private',
        addRandomSuffix: false,
        contentType: input.contentType,
        ...getBlobUploadOptions(),
      });

      return `/uploads/backoffice/${input.relativePath}`;
    }
  }

  if (isHostedRuntime()) {
    throw new Error(
      'Configure BLOB_READ_WRITE_TOKEN no alojamento para guardar imagens fora da base de dados.'
    );
  }

  return null;
}

export async function getPrivateBlobUpload(relativePath: string) {
  if (!isBlobUploadStorageEnabled()) {
    return null;
  }

  return get(`backoffice/${relativePath}`, {
    access: 'private',
    ...getBlobUploadOptions(),
  });
}
