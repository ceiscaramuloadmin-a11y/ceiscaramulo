import { get, put } from '@vercel/blob';

type PublicUploadInput = {
  relativePath: string;
  buffer: Buffer;
  contentType: string;
};

type PublicUploadResult = {
  publicUrl: string;
  storageValue?: string;
};

export function isBlobUploadStorageEnabled() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      (process.env.BLOB_STORE_ID?.trim() && process.env.VERCEL_OIDC_TOKEN?.trim())
  );
}

function getBlobUploadOptions() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

  return {
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
    ...(oidcToken ? { oidcToken } : {}),
  };
}

function isHostedRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function isPrivateStoreAccessError(error: unknown) {
  return String(error instanceof Error ? error.message : error).includes('Cannot use public access on a private store');
}

function isMissingBlobCredentialsError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);

  return message.includes('No blob credentials found') || message.includes('No read-write token found');
}

export async function storePublicUpload(input: PublicUploadInput): Promise<PublicUploadResult | null> {
  if (isBlobUploadStorageEnabled() || isHostedRuntime()) {
    try {
      const blob = await put(`backoffice/${input.relativePath}`, input.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: input.contentType,
        ...getBlobUploadOptions(),
      });

      return { publicUrl: blob.url };
    } catch (error) {
      if (isMissingBlobCredentialsError(error)) {
        throw new Error(
          'O Blob está ativo no código, mas o alojamento não está a disponibilizar BLOB_READ_WRITE_TOKEN nem BLOB_STORE_ID com VERCEL_OIDC_TOKEN ao site publicado.'
        );
      }

      if (!isPrivateStoreAccessError(error)) {
        throw error;
      }

      await put(`backoffice/${input.relativePath}`, input.buffer, {
        access: 'private',
        addRandomSuffix: false,
        contentType: input.contentType,
        ...getBlobUploadOptions(),
      });

      return {
        publicUrl: `/uploads/backoffice/${input.relativePath}`,
        storageValue: `blob-private:${input.relativePath}`,
      };
    }
  }

  if (isHostedRuntime()) {
    throw new Error(
      'Configure BLOB_READ_WRITE_TOKEN ou BLOB_STORE_ID com VERCEL_OIDC_TOKEN no alojamento para guardar imagens fora da base de dados.'
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
