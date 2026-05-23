import { NextResponse } from 'next/server';
import { getSiteLayoutSettings, jsonError } from '@/app/api/_lib/cms';
import { PUBLIC_MEDIA_CACHE_HEADERS } from '@/lib/cache-headers';
import { parseDataUrl } from '@/lib/data-url';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const settings = await getSiteLayoutSettings();
    const rawImage = settings.home.hero.imageUrl || '';

    if (!rawImage.trim().startsWith('data:')) {
      return new NextResponse(null, { status: 404 });
    }

    const parsed = parseDataUrl(rawImage);

    if (!parsed) {
      return jsonError('Imagem hero inválida.', 400);
    }

    return new NextResponse(parsed.buffer, {
      status: 200,
      headers: {
        'Content-Type': parsed.mimeType,
        'Content-Length': String(parsed.buffer.byteLength),
        ...PUBLIC_MEDIA_CACHE_HEADERS,
      },
    });
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
