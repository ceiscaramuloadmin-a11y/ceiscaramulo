import { NextRequest, NextResponse } from 'next/server';
import {
  appendAuditLog,
  createGalleryMedia,
  fileToDataUrl,
  jsonError,
  listGalleryMedia,
  requireAdminContextFromRequest,
  requireAdminFromRequest,
} from '@/app/api/_lib/cms';
import type { GalleryMediaType } from '@/types';

export const runtime = 'nodejs';

function normalizeType(value: unknown): GalleryMediaType {
  return value === 'video' || value === 'audio' ? value : 'photo';
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get('scope') === 'admin' ? 'admin' : 'public';

    if (scope === 'admin') {
      const authError = await requireAdminFromRequest(request);

      if (authError) {
        return authError;
      }
    }

    const items = await listGalleryMedia(scope);
    return NextResponse.json(items);
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

export async function POST(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim() || null;
    const type = normalizeType(formData.get('type'));
    const published = normalizeBoolean(formData.get('published'));
    const sourceUrl = String(formData.get('sourceUrl') || '').trim();
    const thumbUrl = String(formData.get('thumbnailUrl') || '').trim();

    const sourceFileRaw = formData.get('sourceFile');
    const sourceFile = sourceFileRaw instanceof File && sourceFileRaw.size > 0 ? sourceFileRaw : null;

    const thumbFileRaw = formData.get('thumbnailFile');
    const thumbnailFile = thumbFileRaw instanceof File && thumbFileRaw.size > 0 ? thumbFileRaw : null;

    const source = sourceFile ? await fileToDataUrl(sourceFile) : sourceUrl;
    const thumbnail = thumbnailFile ? await fileToDataUrl(thumbnailFile) : thumbUrl || null;

    if (!title) {
      return jsonError('Título é obrigatório.', 400);
    }

    if (!source) {
      return jsonError('Origem do media é obrigatória.', 400);
    }

    const created = await createGalleryMedia({
      title,
      description,
      type,
      source,
      thumbnail,
      mimeType: sourceFile?.type || null,
      published,
    });

    if (context) {
      await appendAuditLog({
        actor: context,
        action: 'gallery_create',
        targetType: 'gallery_media',
        targetId: created.id,
        summary: `Criação de item de galeria (${created.type}).`,
        after: created,
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError(caughtError instanceof Error ? caughtError.message : 'Ocorreu um erro inesperado.', 500);
  }
}

