import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { appendAuditLog, hasAdminPermission, jsonError, requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !hasAdminPermission(context, 'contacts')) {
    return jsonError('Sem permissão para aceder às mensagens de contacto.', 403);
  }

  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
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
