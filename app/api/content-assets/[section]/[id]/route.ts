import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PUBLIC_MEDIA_CACHE_HEADERS } from '@/lib/cache-headers';
import { parseDataUrl } from '@/lib/data-url';
import type { PublicContentSection } from '@/lib/public-content-assets';

export const runtime = 'nodejs';

const SECTION_CONFIG = {
  news: { model: () => prisma.news, field: 'image' },
  activities: { model: () => prisma.activity, field: 'image' },
  projects: { model: () => prisma.project, field: 'image' },
  publications: { model: () => prisma.publication, field: 'coverImage' },
} as const;

function isPublicContentSection(value: string): value is PublicContentSection {
  return value in SECTION_CONFIG;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string; id: string }> }
) {
  const { section, id } = await params;

  if (!isPublicContentSection(section)) {
    return new NextResponse(null, { status: 404 });
  }

  const config = SECTION_CONFIG[section];
  const model = config.model() as unknown as {
    findFirst: (args: {
      where: { id: string; published: true };
      select: Record<string, true>;
    }) => Promise<Record<string, string | null> | null>;
  };
  const item = await model.findFirst({
    where: { id, published: true },
    select: { [config.field]: true },
  });
  const rawAsset = item?.[config.field];

  if (!rawAsset?.trim().startsWith('data:')) {
    return new NextResponse(null, { status: 404 });
  }

  const parsed = parseDataUrl(rawAsset);

  if (!parsed) {
    return NextResponse.json({ message: 'Imagem inválida.' }, { status: 400 });
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
