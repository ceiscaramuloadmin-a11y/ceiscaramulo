import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { appendAuditLog, hasAdminPermission, jsonError, requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';
const DEFAULT_CONTACT_MESSAGES_LIMIT = 80;
const MAX_CONTACT_MESSAGES_LIMIT = 150;

function parseContactMessagesLimit(value: string | null) {
  const parsed = Number.parseInt(String(value || ''), 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_CONTACT_MESSAGES_LIMIT;
  }

  return Math.max(1, Math.min(parsed, MAX_CONTACT_MESSAGES_LIMIT));
}

export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !hasAdminPermission(context, 'contacts')) {
    return jsonError('Sem permissão para aceder às mensagens de contacto.', 403);
  }

  try {
    const url = new URL(request.url);
    const limit = parseContactMessagesLimit(url.searchParams.get('limit'));
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(
      messages.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))
    );
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Não foi possível carregar as mensagens de contacto.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !hasAdminPermission(context, 'contacts')) {
    return jsonError('Sem permissão para gerir as mensagens de contacto.', 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || '').trim();

    if (!id) {
      return jsonError('Identificador da mensagem é obrigatório.', 400);
    }

    const current = await prisma.contactMessage.findUnique({ where: { id } });

    if (!current) {
      return jsonError('Mensagem não encontrada.', 404);
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        read: body?.read === true,
      },
    });

    await appendAuditLog({
      actor: context,
      action: 'contact_message_update',
      targetType: 'contact_message',
      targetId: updated.id,
      summary: `Mensagem de contacto marcada como ${updated.read ? 'lida' : 'não lida'}.`,
      before: current,
      after: updated,
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Não foi possível atualizar a mensagem de contacto.', 500);
  }
}
