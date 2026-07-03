import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  appendAuditLog,
  hasAdminPermission,
  jsonError,
  requireAdminContextFromRequest,
} from '@/app/api/_lib/cms';
import type { AdminPermission, ContentSection } from '@/types';

export const runtime = 'nodejs';

const DEFAULT_COMMENTS_LIMIT = 100;
const MAX_COMMENTS_LIMIT = 200;
const MANAGED_COMMENT_SECTIONS: ContentSection[] = ['news', 'activities', 'publications'];
const COMMENT_PERMISSIONS: AdminPermission[] = ['news', 'activities', 'publications'];

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, MAX_COMMENTS_LIMIT)) : DEFAULT_COMMENTS_LIMIT;
}

function canManageContentComments(context: NonNullable<Awaited<ReturnType<typeof requireAdminContextFromRequest>>['context']>) {
  return COMMENT_PERMISSIONS.some((permission) => hasAdminPermission(context, permission));
}

async function contentTitle(contentType: ContentSection, contentId: string) {
  if (contentType === 'news') {
    const item = await prisma.news.findUnique({ where: { id: contentId }, select: { title: true } });
    return item?.title ?? null;
  }

  if (contentType === 'activities') {
    const item = await prisma.activity.findUnique({ where: { id: contentId }, select: { title: true } });
    return item?.title ?? null;
  }

  if (contentType === 'publications') {
    const item = await prisma.publication.findUnique({ where: { id: contentId }, select: { title: true } });
    return item?.title ?? null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !canManageContentComments(context)) {
    return jsonError('Sem permissão para gerir comentários.', 403);
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  const comments = await prisma.contentComment.findMany({
    where: { contentType: { in: MANAGED_COMMENT_SECTIONS } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const enriched = await Promise.all(
    comments.map(async (comment) => ({
      ...comment,
      contentTitle: await contentTitle(comment.contentType as ContentSection, comment.contentId),
    }))
  );

  return NextResponse.json(enriched);
}

export async function DELETE(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !canManageContentComments(context)) {
    return jsonError('Sem permissão para eliminar comentários.', 403);
  }

  const id = request.nextUrl.searchParams.get('id') || '';

  if (!id) {
    return jsonError('Comentário obrigatório.', 400);
  }

  const current = await prisma.contentComment.findUnique({ where: { id } });

  if (!current || !MANAGED_COMMENT_SECTIONS.includes(current.contentType as ContentSection)) {
    return jsonError('Comentário não encontrado.', 404);
  }

  await prisma.contentComment.delete({ where: { id } });

  await appendAuditLog({
    actor: context,
    action: 'comment_delete',
    targetType: 'content_comment',
    targetId: id,
    summary: `Remoção de comentário em ${current.contentType}.`,
    before: current,
  });

  return new NextResponse(null, { status: 204 });
}
