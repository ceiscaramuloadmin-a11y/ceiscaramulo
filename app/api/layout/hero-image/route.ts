import { NextResponse } from 'next/server';
import { getSiteLayoutSettings, jsonError } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i.exec(dataUrl.trim());

  if (!match) {
    return null;
  }

  const mimeType = match[1] || 'application/octet-stream';
  const payload = match[2];

  try {
    const buffer = Buffer.from(payload, 'base64');
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

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
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=604800',
      },
    });
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
