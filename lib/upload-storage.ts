import { put } from '@vercel/blob';

type PublicUploadInput = {
  relativePath: string;
  buffer: Buffer;
  contentType: string;
};

export function isBlobUploadStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function isHostedRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

export async function storePublicUpload(input: PublicUploadInput) {
  if (isBlobUploadStorageEnabled()) {
    const blob = await put(`backoffice/${input.relativePath}`, input.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: input.contentType,
    });

    return blob.url;
  }

  if (isHostedRuntime()) {
    throw new Error(
      'Configure BLOB_READ_WRITE_TOKEN no alojamento para guardar imagens fora da base de dados.'
    );
  }

  return null;
}
