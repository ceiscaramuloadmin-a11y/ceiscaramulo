import { NextResponse } from 'next/server';
import { getGalleryMediaById } from '@/app/api/_lib/cms';
import { PUBLIC_MEDIA_CACHE_HEADERS } from '@/lib/cache-headers';
import { parseDataUrl } from '@/lib/data-url';
import type { GalleryAssetField } from '@/lib/gallery-public-assets';

export const runtime = 'nodejs';

function isGalleryAssetField(value: string): value is GalleryAssetField {
  return value === 'source' || value === 'thumbnail';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; field: string }> }
) {
  const { id, field } = await params;

  if (!isGalleryAssetField(field)) {
    return new NextResponse(null, { status: 404 });
  }

  const item = await getGalleryMediaById(id, 'public');
  const rawAsset = item?.[field];

  if (!rawAsset?.trim().startsWith('data:')) {
    return new NextResponse(null, { status: 404 });
  }

  const parsed = parseDataUrl(rawAsset);

  if (!parsed) {
    return NextResponse.json({ message: 'Media inválido.' }, { status: 400 });
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
