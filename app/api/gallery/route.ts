import { NextRequest, NextResponse } from 'next/server';
import {
  appendAuditLog,
  createGalleryMedia,
  jsonError,
  listGalleryMedia,
  requireAdminContextFromRequest,
  requireAdminFromRequest,
  storeUploadedFile,
} from '@/app/api/_lib/cms';
import { PUBLIC_DATA_CACHE_HEADERS } from '@/lib/cache-headers';
import { withPublicGalleryAssets } from '@/lib/gallery-public-assets';
import type { GalleryMediaType } from '@/types';

export const runtime = 'nodejs';
const DEFAULT_ADMIN_GALLERY_LIMIT = 120;
const MAX_ADMIN_GALLERY_LIMIT = 200;

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

function parseAdminGalleryLimit(value: string | null) {
  const parsed = Number.parseInt(String(value || ''), 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_ADMIN_GALLERY_LIMIT;
  }

  return Math.max(1, Math.min(parsed, MAX_ADMIN_GALLERY_LIMIT));
}

export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get('scope') === 'admin' ? 'admin' : 'public';
    const context = normalizeGalleryContext(request.nextUrl.searchParams.get('context'));
    const limit = scope === 'admin' ? parseAdminGalleryLimit(request.nextUrl.searchParams.get('limit')) : undefined;

    if (scope === 'admin') {
      const authError = await requireAdminFromRequest(request);

      if (authError) {
        return authError;
      }
    }

    const items = await listGalleryMedia(scope, context, limit);

    if (scope === 'public') {
      return NextResponse.json(items.map(withPublicGalleryAssets), {
        headers: PUBLIC_DATA_CACHE_HEADERS,
      });
    }

    return NextResponse.json(items.map(withPublicGalleryAssets));
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
    const galleryContext = normalizeGalleryContext(formData.get('context'));
    const published = normalizeBoolean(formData.get('published'));
    const sourceUrl = String(formData.get('sourceUrl') || '').trim();
    const thumbUrl = String(formData.get('thumbnailUrl') || '').trim();

    const sourceFileRaw = formData.get('sourceFile');
    const sourceFile = sourceFileRaw instanceof File && sourceFileRaw.size > 0 ? sourceFileRaw : null;

    const thumbFileRaw = formData.get('thumbnailFile');
    const thumbnailFile = thumbFileRaw instanceof File && thumbFileRaw.size > 0 ? thumbFileRaw : null;

    const source = sourceFile ? await storeUploadedFile(sourceFile, `gallery-${galleryContext}`) : sourceUrl;
    const thumbnail = thumbnailFile ? await storeUploadedFile(thumbnailFile, `gallery-thumbnails-${galleryContext}`) : thumbUrl || null;

    if (!title) {
      return jsonError('Título é obrigatório.', 400);
    }

    const created = await createGalleryMedia({
      title,
      description,
      type,
      context: galleryContext,
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
