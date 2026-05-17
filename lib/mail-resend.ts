/** Integração minimalista com a API HTTPS do Resend (sem pacote NPM extra). */

export type ResendEmailPayload = {
  /** Endereço “From” verificado na conta Resend (ex.: `Boletim <boletim@teudominio.pt>`). */
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmailViaResend(payload: ResendEmailPayload): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { ok: false, reason: 'missing_api_key' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  const bodyUnknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage =
      typeof bodyUnknown === 'object' &&
      bodyUnknown &&
      'message' in bodyUnknown &&
      typeof (bodyUnknown as { message?: unknown }).message === 'string'
        ? (bodyUnknown as { message: string }).message
        : null;
    return { ok: false, reason: apiMessage ?? `http_${response.status}` };
  }

  return { ok: true };
}

export function resolveMailSenderAddress(): string | null {
  return (
    process.env.MAIL_FROM?.trim() ||
    process.env.RESEND_MAIL_FROM?.trim() ||
    null
  );
}
