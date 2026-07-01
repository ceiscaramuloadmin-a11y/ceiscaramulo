import { NextRequest, NextResponse } from 'next/server';
import {
  appendAuditLog,
  deleteGalleryMedia,
  getGalleryMediaById,
  jsonError,
  requireAdminContextFromRequest,
  requireAdminFromRequest,
  storeUploadedFile,
  updateGalleryMedia,
} from '@/app/api/_lib/cms';
import type { GalleryMediaType } from '@/types';

export const runtime = 'nodejs';

function normalizeType(value: unknown): GalleryMediaType {
  return value === 'video' || value === 'audio' || value === 'document' ? value : 'photo';
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function normalizeGalleryContext(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized.replace(/[^a-z0-9-]/g, '-') || 'global';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scope = request.nextUrl.searchParams.get('scope') === 'admin' ? 'admin' : 'public';

    if (scope === 'admin') {
      const authError = await requireAdminFromRequest(request);

      if (authError) {
        return authError;
      }
    }

    const item = await getGalleryMediaById(id, scope);

    if (!item) {
      return jsonError('Registo não encontrado.', 404);
    }

    return NextResponse.json(item);
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  try {
    const { id } = await params;
    const current = await getGalleryMediaById(id, 'admin');

    if (!current) {
      return jsonError('Registo não encontrado.', 404);
    }

    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim() || null;
    const type = normalizeType(formData.get('type'));
    const galleryContext = normalizeGalleryContext(formData.get('context') || current.context);
    const published = normalizeBoolean(formData.get('published'));
    const sourceUrl = String(formData.get('sourceUrl') || '').trim();
    const thumbnailUrl = String(formData.get('thumbnailUrl') || '').trim();

    const sourceFileRaw = formData.get('sourceFile');
    const sourceFile = sourceFileRaw instanceof File && sourceFileRaw.size > 0 ? sourceFileRaw : null;

    const thumbnailFileRaw = formData.get('thumbnailFile');
    const thumbnailFile = thumbnailFileRaw instanceof File && thumbnailFileRaw.size > 0 ? thumbnailFileRaw : null;

    const source = sourceFile ? await storeUploadedFile(sourceFile, `gallery-${galleryContext}`) : sourceUrl || current.source;
    const thumbnail = thumbnailFile ? await storeUploadedFile(thumbnailFile, `gallery-thumbnails-${galleryContext}`) : thumbnailUrl || current.thumbnail || null;

    if (!title) {
      return jsonError('Título é obrigatório.', 400);
    }

    const updated = await updateGalleryMedia(id, {
      title,
      description,
      type,
      context: galleryContext,
      source,
      thumbnail,
      mimeType: sourceFile?.type || current.mimeType || null,
      published,
    });

    if (!updated) {
      return jsonError('Registo não encontrado.', 404);
    }

    if (context) {
      await appendAuditLog({
        actor: context,
        action: 'gallery_update',
        targetType: 'gallery_media',
        targetId: id,
        summary: `Atualização de item de galeria (${updated.type}).`,
        before: current,
        after: updated,
      });
    }

    return NextResponse.json(updated);
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError(caughtError instanceof Error ? caughtError.message : 'Ocorreu um erro inesperado.', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  try {
    const { id } = await params;
    const current = await getGalleryMediaById(id, 'admin');

    if (!current) {
      return jsonError('Registo não encontrado.', 404);
    }

    const deleted = await deleteGalleryMedia(id);

    if (!deleted) {
      return jsonError('Registo não encontrado.', 404);
    }

    if (context) {
      await appendAuditLog({
        actor: context,
        action: 'gallery_delete',
        targetType: 'gallery_media',
        targetId: id,
        summary: `Remoção de item de galeria (${current.type}).`,
        before: current,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
