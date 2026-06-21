import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendNewsletterSubscriptionConfirmation } from '@/lib/newsletter-on-publish';

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
    const unknown = await readNewsletterPayload(request);
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

  const confirmation = await sendNewsletterSubscriptionConfirmation(normalized);

  if (!confirmation.ok) {
    console.warn('Subscrição guardada, mas email de confirmação não enviado:', confirmation.reason);
  }

  return Response.json({
    ok: true,
    message: confirmation.ok
      ? 'Subscrição confirmada. Enviámos um email de confirmação para a tua caixa de correio.'
      : 'Subscrição confirmada. Obrigado pelo interesse na newsletter.',
  });
}

async function readNewsletterPayload(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return { email: formData.get('email') || formData.get('newsletter-email') };
  }

  return request.json();
}

function isNewsletterPersistenceReady(): boolean {
  return (
    'newsletterSubscriber' in prisma &&
    typeof prisma.newsletterSubscriber?.upsert === 'function'
  );
}
