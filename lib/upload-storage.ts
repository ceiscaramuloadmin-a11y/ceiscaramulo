import { get } from '@vercel/blob';

function isBlobUploadStorageEnabled() {
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
