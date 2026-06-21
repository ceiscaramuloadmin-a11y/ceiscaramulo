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

const DATABASE_IMAGE_BACKUP_MAX_BYTES = 5 * 1024 * 1024;

function canUseDatabaseImageBackup(input: PublicUploadInput) {
  return input.contentType.startsWith('image/') && input.buffer.byteLength <= DATABASE_IMAGE_BACKUP_MAX_BYTES;
}

function dataUrlFromUpload(input: PublicUploadInput) {
  return `data:${input.contentType};base64,${input.buffer.toString('base64')}`;
}

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

function databaseImageBackup(input: PublicUploadInput): PublicUploadResult | null {
  if (!canUseDatabaseImageBackup(input)) {
    return null;
  }

  return {
    publicUrl: `/uploads/backoffice/${input.relativePath}`,
    storageValue: dataUrlFromUpload(input),
  };
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
        return databaseImageBackup(input);
      }

      if (!isPrivateStoreAccessError(error)) {
        const backup = databaseImageBackup(input);

        if (backup) {
          console.error(`Blob upload failed for "${input.relativePath}". Using database image backup.`, error);
          return backup;
        }

        throw error;
      }

      await put(`backoffice/${input.relativePath}`, input.buffer, {
        access: 'private',
        addRandomSuffix: false,
        contentType: input.contentType,
        ...getBlobUploadOptions(),
      });

      return (
        databaseImageBackup(input) ?? {
          publicUrl: `/uploads/backoffice/${input.relativePath}`,
          storageValue: `blob-private:${input.relativePath}`,
        }
      );
    }
  }

  return null;
}

export async function getPrivateBlobUpload(relativePath: string) {
  if (!isBlobUploadStorageEnabled()) {
    return null;
  }

  const pathname = `backoffice/${relativePath}`;
  const options = getBlobUploadOptions();
  const privateBlob = await get(pathname, {
    access: 'private',
    ...options,
  });

  if (privateBlob) {
    return privateBlob;
  }

  return get(pathname, {
    access: 'public',
    ...options,
  });
}
