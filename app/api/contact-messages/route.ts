import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidEmail, jsonError } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();

    if (!name || !email || !subject || !message) {
      return jsonError('Preencha nome, email, assunto e mensagem.', 400);
    }

    if (!isValidEmail(email)) {
      return jsonError('O email indicado não é válido.', 400);
    }

    const created = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        message: 'Mensagem enviada com sucesso. Obrigado pelo contacto.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return jsonError('Não foi possível enviar a mensagem neste momento.', 500);
  }
}
