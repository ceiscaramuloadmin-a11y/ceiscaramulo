import { z } from 'zod';
import prisma from '@/lib/prisma';

const bodySchema = z.object({
  email: z.string().trim().email('Email inválido.').max(320),
});

/**
 * Aceita subscrições públicas de newsletter sem autenticação.
 * Mensagens devem permanecer genéricas para não revelar se o email já existia na base (privacidade).
 */
export async function POST(request: Request) {
  if (!isNewsletterPersistenceReady()) {
    return Response.json(
      {
        ok: false,
        message:
          'O serviço de subscrição está temporariamente indisponível. Tenta mais tarde ou contacta através da página Contactos.',
      },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const unknown = await request.json();
    parsed = bodySchema.parse(unknown);
  } catch {
    return Response.json({ ok: false, message: 'Corpo inválido. Envia apenas { "email": "..." } com um email válido.' }, {
      status: 400,
    });
  }

  const normalized = parsed.email.trim().toLowerCase();

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: { email: normalized },
      update: {},
    });
  } catch (error) {
    console.warn('Erro ao guardar subscrição da newsletter:', error);
    return Response.json(
      {
        ok: false,
        message: 'Não foi possível concluir a subscrição. Tenta mais tarde ou usa a página de Contactos.',
      },
      { status: 503 }
    );
  }

  return Response.json({
    ok: true,
    message: 'Pedido registado com sucesso. Obrigado pelo interesse na newsletter.',
  });
}

function isNewsletterPersistenceReady(): boolean {
  return (
    'newsletterSubscriber' in prisma &&
    typeof prisma.newsletterSubscriber?.upsert === 'function'
  );
}
