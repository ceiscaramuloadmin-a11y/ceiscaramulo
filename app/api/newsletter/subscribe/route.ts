import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendNewsletterInternalNotification, sendNewsletterSubscriptionConfirmation } from '@/lib/newsletter-on-publish';

const bodySchema = z
  .object({
    email: z.string().trim().email('Email invalido.').max(320),
    wantsNews: z.boolean().optional().default(true),
    wantsActivities: z.boolean().optional().default(true),
  })
  .refine((value) => value.wantsNews || value.wantsActivities, {
    message: 'Seleciona pelo menos noticias ou atividades.',
  });

export async function POST(request: Request) {
  if (!isNewsletterPersistenceReady()) {
    return Response.json(
      {
        ok: false,
        message: 'O servico de subscricao esta temporariamente indisponivel. Tenta mais tarde ou contacta atraves da pagina Contactos.',
      },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const unknown = await readNewsletterPayload(request);
    parsed = bodySchema.parse(unknown);
  } catch {
    return Response.json(
      { ok: false, message: 'Corpo invalido. Envia um email valido e seleciona pelo menos noticias ou atividades.' },
      { status: 400 }
    );
  }

  const normalized = parsed.email.trim().toLowerCase();

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: {
        email: normalized,
        wantsNews: parsed.wantsNews,
        wantsActivities: parsed.wantsActivities,
      },
      update: {
        wantsNews: parsed.wantsNews,
        wantsActivities: parsed.wantsActivities,
      },
    });
  } catch (error) {
    console.warn('Erro ao guardar subscricao da newsletter:', error);
    return Response.json(
      {
        ok: false,
        message: 'Nao foi possivel concluir a subscricao. Tenta mais tarde ou usa a pagina de Contactos.',
      },
      { status: 503 }
    );
  }

  const preferences = {
    wantsNews: parsed.wantsNews,
    wantsActivities: parsed.wantsActivities,
  };
  const confirmation = await sendNewsletterSubscriptionConfirmation(normalized);
  const internalNotification = await sendNewsletterInternalNotification(normalized, preferences);

  if (!confirmation.ok) {
    console.warn('Subscricao guardada, mas email de confirmacao nao enviado:', confirmation.reason);
  }

  if (!internalNotification.ok) {
    console.warn('Subscricao guardada, mas aviso interno da newsletter nao enviado:', internalNotification.reason);
  }

  return Response.json({
    ok: true,
    message: confirmation.ok
      ? 'Subscricao confirmada. Enviamos um email de confirmacao para a tua caixa de correio.'
      : 'Email guardado com sucesso. Para qualquer questao, contacta o CEISCaramulo.',
  });
}

async function readNewsletterPayload(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return {
      email: formData.get('email') || formData.get('newsletter-email'),
      wantsNews: parseFormBoolean(formData.get('wantsNews'), true),
      wantsActivities: parseFormBoolean(formData.get('wantsActivities'), true),
    };
  }

  return request.json();
}

function parseFormBoolean(value: FormDataEntryValue | null, fallback: boolean) {
  if (value === null) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === 'on' || normalized === 'true' || normalized === '1';
}

function isNewsletterPersistenceReady(): boolean {
  return 'newsletterSubscriber' in prisma && typeof prisma.newsletterSubscriber?.upsert === 'function';
}
