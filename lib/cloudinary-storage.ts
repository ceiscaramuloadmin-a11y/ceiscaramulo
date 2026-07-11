import { extname, posix } from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

type CloudinaryUploadInput = {
  relativePath: string;
  buffer: Buffer;
  contentType: string;
};

type CloudinaryUploadSignatureInput = {
  relativePath: string;
};

const LARGE_UPLOAD_MIN_BYTES = 90 * 1024 * 1024;
const CLOUDINARY_CHUNK_SIZE_BYTES = 20 * 1024 * 1024;

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryStorageEnabled() {
  return Boolean(cloudinaryConfig());
}

function configureCloudinary() {
  const config = cloudinaryConfig();

  if (!config) {
    return null;
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return config;
}

function normalizedRelativePath(relativePath: string) {
  const normalized = relativePath
    .split('/')
    .map((segment) => segment.trim().replace(/[^a-z0-9._-]/gi, '-'))
    .filter(Boolean)
    .join('/');

  if (!normalized || normalized.includes('..') || !/^[a-z0-9-]+\/[a-z0-9._/-]+$/i.test(normalized)) {
    throw new Error('Caminho de upload invalido.');
  }

  return normalized;
}

export function cloudinaryPublicIdFromRelativePath(relativePath: string) {
  const normalized = normalizedRelativePath(relativePath);
  const parsed = posix.parse(`backoffice/${normalized}`);
  const nameWithoutExtension = parsed.name || parsed.base.replace(extname(parsed.base), '');

  return posix.join(parsed.dir, nameWithoutExtension);
}

export async function uploadBufferToCloudinary(input: CloudinaryUploadInput) {
  const config = configureCloudinary();

  if (!config) {
    return null;
  }

  const publicId = cloudinaryPublicIdFromRelativePath(input.relativePath);

  return new Promise<{ publicUrl: string; storageValue: string }>((resolve, reject) => {
    const options = {
      public_id: publicId,
      resource_type: 'auto' as const,
      overwrite: true,
      use_filename: false,
      unique_filename: false,
      type: 'upload' as const,
      context: {
        original_path: input.relativePath,
        content_type: input.contentType,
      },
    };
    const handleResult = (error: unknown, result?: { secure_url?: string; error?: unknown }) => {
      if (error || result?.error || !result?.secure_url) {
        reject(error ?? result?.error ?? new Error('Cloudinary nao devolveu URL segura.'));
        return;
      }

      resolve({
        publicUrl: result.secure_url,
        storageValue: `cloudinary:${result.secure_url}`,
      });
    };
    const stream =
      input.buffer.byteLength >= LARGE_UPLOAD_MIN_BYTES
        ? cloudinary.uploader.upload_chunked_stream(
            {
              ...options,
              chunk_size: CLOUDINARY_CHUNK_SIZE_BYTES,
            },
            handleResult
          )
        : cloudinary.uploader.upload_stream(options, handleResult);

    stream.end(input.buffer);
  });
}

export function createCloudinaryUploadSignature(input: CloudinaryUploadSignatureInput) {
  const config = configureCloudinary();

  if (!config) {
    throw new Error('Cloudinary nao esta configurado.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const publicId = cloudinaryPublicIdFromRelativePath(input.relativePath);
  const paramsToSign = {
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    publicId,
    overwrite: 'true',
    signature: cloudinary.utils.api_sign_request(paramsToSign, config.apiSecret),
  };
}

export function cloudinaryUrlFromStorageValue(value: string | null | undefined) {
  const trimmed = String(value || '').trim();

  if (trimmed.startsWith('cloudinary:')) {
    return trimmed.slice('cloudinary:'.length);
  }

  if (/^https:\/\/res\.cloudinary\.com\/[^/]+\//.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function cloudinaryPublicIdFromUrl(value: string | null | undefined) {
  const cloudinaryUrl = cloudinaryUrlFromStorageValue(value);

  if (!cloudinaryUrl) {
    return null;
  }

  try {
    const parts = new URL(cloudinaryUrl).pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex < 0) {
      return null;
    }

    const publicIdParts = parts.slice(uploadIndex + 1).filter((part) => !/^v\d+$/.test(part));
    const publicId = publicIdParts.join('/').replace(/\.[a-z0-9]+$/i, '');

    return publicId || null;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryUpload(value: string | null | undefined) {
  const config = configureCloudinary();
  const publicId = cloudinaryPublicIdFromUrl(value);

  if (!config || !publicId) {
    return false;
  }

  for (const resourceType of ['image', 'video', 'raw'] as const) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      if (result?.result === 'ok' || result?.result === 'not found') {
        return true;
      }
    } catch (error) {
      if (resourceType === 'raw') {
        console.warn(`Could not delete Cloudinary upload "${publicId}".`, error);
      }
    }
  }

  return false;
}
