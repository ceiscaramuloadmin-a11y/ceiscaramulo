import prisma from '@/lib/prisma';
import { resolveMailSenderAddress, sendEmailViaResend } from '@/lib/mail-resend';
import { richTextToPlainText } from '@/lib/richText';

/** Decisão pura: só vale o disparo na primeira publicação efetiva. */
export function shouldAnnounceNewsEmail(previousPublished: boolean | null, nextPublished: boolean): boolean {
  if (!nextPublished) {
    return false;
  }

  if (previousPublished === null) {
    return nextPublished;
  }

  return !previousPublished && nextPublished;
}

export type ArticleEmailShape = {
  slug: string;
  title: string;
  excerpt: string;
};

export type ActivityEmailShape = {
  id: string;
  title: string;
  description: string;
};

export type NewsletterDeliveryResult = {
  attempted: boolean;
  sent: number;
  failed: number;
  skippedReason?: 'not_first_publish' | 'missing_sender' | 'no_subscribers';
};

/** Envia durante o pedido para não depender de microtasks descartáveis em serverless. */
export async function enqueueNewsPublishedNotifications(
  previousPublished: boolean | null,
  article: ArticleEmailShape & { published: boolean }
): Promise<NewsletterDeliveryResult> {
  if (!shouldAnnounceNewsEmail(previousPublished, article.published)) {
    return { attempted: false, sent: 0, failed: 0, skippedReason: 'not_first_publish' };
  }

  const { slug, title, excerpt } = article;
  return notifySubscribersAboutPublishedArticle({ slug, title, excerpt });
}

export async function enqueueActivityPublishedNotifications(
  previousPublished: boolean | null,
  activity: ActivityEmailShape & { published: boolean }
): Promise<NewsletterDeliveryResult> {
  if (!shouldAnnounceNewsEmail(previousPublished, activity.published)) {
    return { attempted: false, sent: 0, failed: 0, skippedReason: 'not_first_publish' };
  }

  const { id, title, description } = activity;
  return notifySubscribersAboutPublishedActivity({ id, title, description });
}

function publicSiteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.APP_BASE_URL || process.env.VERCEL_URL;
  if (!raw?.trim()) {
    return 'https://ceiscaramulo.pt';
  }

  const trimmed = raw.trim();

  if (!trimmed.includes('://')) {
    return `https://${trimmed.replace(/\/+$/, '')}`;
  }

  return trimmed.replace(/\/+$/, '');
}

export async function notifySubscribersAboutPublishedArticle(article: ArticleEmailShape): Promise<NewsletterDeliveryResult> {
  const origin = publicSiteOrigin();
  const link = `${origin}/noticias/${encodeURIComponent(article.slug)}`;
  const teaser = richTextToPlainText(article.excerpt).slice(0, 320);

  return notifySubscribersAboutPublishedContent({
    title: article.title,
    teaser,
    link,
    subject: `Nova notícia: ${article.title}`,
    ctaLabel: 'Ler notícia completa',
  });
}

export async function notifySubscribersAboutPublishedActivity(activity: ActivityEmailShape): Promise<NewsletterDeliveryResult> {
  const origin = publicSiteOrigin();
  const link = `${origin}/atividades/${encodeURIComponent(activity.id)}`;
  const teaser = richTextToPlainText(activity.description).slice(0, 320);

  return notifySubscribersAboutPublishedContent({
    title: activity.title,
    teaser,
    link,
    subject: `Nova atividade: ${activity.title}`,
    ctaLabel: 'Ver atividade',
  });
}

async function notifySubscribersAboutPublishedContent(parts: {
  title: string;
  teaser: string;
  link: string;
  subject: string;
  ctaLabel: string;
}): Promise<NewsletterDeliveryResult> {
  const from = resolveMailSenderAddress();

  if (!from) {
    console.warn('[newsletter] MAIL_FROM / RESEND_MAIL_FROM ausente: subscritores não receberam email.');
    return { attempted: false, sent: 0, failed: 0, skippedReason: 'missing_sender' };
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    select: { email: true },
  });

  if (!subscribers.length) {
    return { attempted: false, sent: 0, failed: 0, skippedReason: 'no_subscribers' };
  }

  const html = buildNewsEmailHtml({
    title: parts.title,
    teaser: parts.teaser,
    link: parts.link,
    ctaLabel: parts.ctaLabel,
  });
  let sent = 0;
  let failed = 0;

  for (const row of subscribers) {
    const outcome = await sendEmailViaResend({
      from,
      to: row.email,
      subject: parts.subject,
      html,
      text: `${parts.title}\n\n${parts.teaser}\n\nLer em: ${parts.link}`,
    });

    if (outcome.ok) {
      sent += 1;
    } else {
      failed += 1;

      if (outcome.reason !== 'missing_api_key') {
        console.warn(`[newsletter] falha Resend para ${row.email}: ${outcome.reason}`);
      }
    }
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn('[newsletter] RESEND_API_KEY ausente: destinatários listados mas emails não entregues.');
  }

  return { attempted: true, sent, failed };
}

export async function sendNewsletterSubscriptionConfirmation(email: string) {
  const from = resolveMailSenderAddress();

  if (!from) {
    console.warn('[newsletter] MAIL_FROM / RESEND_MAIL_FROM ausente: confirmação de subscrição não enviada.');
    return { ok: false as const, reason: 'missing_sender' };
  }

  const origin = publicSiteOrigin();

  return sendEmailViaResend({
    from,
    to: email,
    subject: 'Subscrição confirmada - CEISCaramulo',
    html: buildSubscriptionConfirmationHtml({ link: origin }),
    text: `Subscrição confirmada.\n\nObrigado por subscreveres a newsletter do CEISCaramulo. Vais receber novidades e notícias quando forem publicadas.\n\nSite: ${origin}`,
  });
}

function buildNewsEmailHtml(parts: { title: string; teaser: string; link: string; ctaLabel: string }) {
  return `
<!DOCTYPE html>
<html lang="pt">
  <body style="margin:0;font-family:system-ui,sans-serif;background:#f6f5f2;color:#1f2a16;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:32px 16px;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e3e4dd;">
            <p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0f4c36;">CEISCaramulo</p>
            <h1 style="margin:16px 0 12px;font-size:22px;line-height:1.2;">${escapeEmailAttr(parts.title)}</h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#374151;">${escapeEmailAttr(parts.teaser)}</p>
            <a href="${parts.link}" style="display:inline-block;background:#0f4c36;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">
              ${escapeEmailAttr(parts.ctaLabel)}
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">Se não quiseres estes avisos, responde pedindo remoção ou contacta CEISCaramulo.</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function buildSubscriptionConfirmationHtml(parts: { link: string }) {
  return `
<!DOCTYPE html>
<html lang="pt">
  <body style="margin:0;font-family:system-ui,sans-serif;background:#f6f5f2;color:#1f2a16;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:32px 16px;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e3e4dd;">
            <p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0f4c36;">CEISCaramulo</p>
            <h1 style="margin:16px 0 12px;font-size:22px;line-height:1.2;">Subscrição confirmada</h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#374151;">Obrigado por subscreveres a newsletter. A partir de agora vais receber novidades e notícias quando forem publicadas.</p>
            <a href="${parts.link}" style="display:inline-block;background:#0f4c36;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">
              Visitar CEISCaramulo
            </a>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function escapeEmailAttr(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
