import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findContent, isContentSection, isValidEmail, jsonError } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ section: string; identifier: string }> }) {
  try {
    const { section, identifier } = await params;

    if (!isContentSection(section)) {
      return jsonError('Secção inválida.', 404);
    }

    const content = await findContent(section, identifier, 'public');

    if (!content) {
      return jsonError('Conteúdo não encontrado.', 404);
    }

    const comments = await prisma.contentComment.findMany({
      where: {
        contentType: section,
        contentId: content.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ section: string; identifier: string }> }) {
  try {
    const { section, identifier } = await params;

    if (!isContentSection(section)) {
      return jsonError('Secção inválida.', 404);
    }

    const content = await findContent(section, identifier, 'public');

    if (!content) {
      return jsonError('Conteúdo não encontrado.', 404);
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const message = String(body?.message || '').trim();

    if (!name) {
      return jsonError('O nome é obrigatório.', 400);
    }

    if (!message) {
      return jsonError('A mensagem é obrigatória.', 400);
    }

    if (!email || !isValidEmail(email)) {
      return jsonError('Indique um email válido.', 400);
    }

    const comment = await prisma.contentComment.create({
      data: {
        contentType: section,
        contentId: content.id,
        name,
        email,
        message,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
