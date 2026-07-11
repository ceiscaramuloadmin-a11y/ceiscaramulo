import { NextResponse } from 'next/server';
import { getStoredUploadedFile } from '@/app/api/_lib/cms';
import { PUBLIC_MEDIA_CACHE_HEADERS } from '@/lib/cache-headers';
import { cloudinaryUrlFromStorageValue } from '@/lib/cloudinary-storage';
import { parseDataUrl } from '@/lib/data-url';
import { getPrivateBlobUpload } from '@/lib/upload-storage';

export const runtime = 'nodejs';

function normalizedRelativePath(path: string[]) {
  const relativePath = path
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');

  if (!relativePath || relativePath.includes('..') || !/^[a-z0-9-]+\/[a-z0-9._-]+$/i.test(relativePath)) {
    return null;
  }

  return relativePath;
}

async function respondWithPrivateBlob(relativePath: string) {
  try {
    const blob = await getPrivateBlobUpload(relativePath);

    if (!blob || blob.statusCode !== 200) {
      console.warn(`Uploaded file "${relativePath}" was not found in Blob storage.`);
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      status: 200,
      headers: {
        'Content-Type': blob.blob.contentType,
        'Content-Length': String(blob.blob.size),
        ...PUBLIC_MEDIA_CACHE_HEADERS,
      },
    });
  } catch (error) {
    console.error(`Unable to read uploaded Blob file "${relativePath}".`, error);
    return new NextResponse(null, { status: 404 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const relativePath = normalizedRelativePath(path);

  if (!relativePath) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const stored = await getStoredUploadedFile(path);

    if (stored?.startsWith('blob-private:')) {
      return respondWithPrivateBlob(stored.slice('blob-private:'.length));
    }

    const cloudinaryUrl = cloudinaryUrlFromStorageValue(stored);

    if (cloudinaryUrl) {
      return NextResponse.redirect(cloudinaryUrl, {
        status: 307,
        headers: PUBLIC_MEDIA_CACHE_HEADERS,
      });
    }

    if (stored) {
      const parsed = parseDataUrl(stored);

      if (!parsed) {
        console.warn('Stored uploaded file metadata is not a valid data URL.');
        return new NextResponse(null, { status: 404 });
      }

      return new NextResponse(parsed.buffer, {
        status: 200,
        headers: {
          'Content-Type': parsed.mimeType,
          'Content-Length': String(parsed.buffer.byteLength),
          ...PUBLIC_MEDIA_CACHE_HEADERS,
        },
      });
    }
  } catch (error) {
    console.error('Unable to read uploaded file metadata.', error);
  }

  return respondWithPrivateBlob(relativePath);
}
