/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    newsletterSubscriber: { findMany },
  },
}));

vi.mock('@/lib/mail-resend', () => ({
  resolveMailSenderAddress: vi.fn(() => 'Boletim <noreply@test.pt>'),
  sendEmailViaResend: vi.fn(() => Promise.resolve({ ok: true as const })),
}));

import * as newsletter from '@/lib/newsletter-on-publish';
import * as mailResend from '@/lib/mail-resend';

describe('shouldAnnounceNewsEmail', () => {
  it('não dispara quando a notícia fica não publicada', () => {
    expect(newsletter.shouldAnnounceNewsEmail(null, false)).toBe(false);
    expect(newsletter.shouldAnnounceNewsEmail(true, false)).toBe(false);
    expect(newsletter.shouldAnnounceNewsEmail(false, false)).toBe(false);
  });

  it('dispara na primeira guarda já publicada (criação)', () => {
    expect(newsletter.shouldAnnounceNewsEmail(null, true)).toBe(true);
  });

  it('dispara na transição rascunho → publicado', () => {
    expect(newsletter.shouldAnnounceNewsEmail(false, true)).toBe(true);
  });

  it('não dispara quando já estava publicada', () => {
    expect(newsletter.shouldAnnounceNewsEmail(true, true)).toBe(false);
  });
});

describe('notifySubscribersAboutPublishedArticle', () => {
  beforeEach(() => {
    findMany.mockReset();
    vi.mocked(mailResend.sendEmailViaResend).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(mailResend.resolveMailSenderAddress).mockReset().mockReturnValue('Boletim <noreply@test.pt>');
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mysite.pt';
    process.env.RESEND_API_KEY = 're_test';
    delete process.env.SITE_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('envia um email por subscritor com link público esperado', async () => {
    findMany.mockResolvedValue([{ email: 'a@test.pt' }, { email: 'b@test.pt' }]);

    await newsletter.notifySubscribersAboutPublishedArticle({
      slug: 'minha-slug',
      title: 'Título',
      excerpt: '<p>Olá mundo</p>',
    });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(mailResend.sendEmailViaResend).toHaveBeenCalledTimes(2);

    const firstPayload = vi.mocked(mailResend.sendEmailViaResend).mock.calls[0][0];
    expect(firstPayload).toMatchObject({
      from: 'Boletim <noreply@test.pt>',
      to: 'a@test.pt',
      subject: 'Nova notícia: Título',
    });
    expect(firstPayload.html).toContain('https://mysite.pt/noticias/minha-slug');
    expect(firstPayload.text).toContain('https://mysite.pt/noticias/minha-slug');
  });

  it('não consulta a base nem envia quando falta endereço remetente', async () => {
    vi.mocked(mailResend.resolveMailSenderAddress).mockReturnValue(null);
    findMany.mockResolvedValue([{ email: 'a@test.pt' }]);

    await newsletter.notifySubscribersAboutPublishedArticle({
      slug: 's',
      title: 'T',
      excerpt: '',
    });

    expect(findMany).not.toHaveBeenCalled();
    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();
  });

  it('não chama Resend sem subscritores', async () => {
    findMany.mockResolvedValue([]);

    await newsletter.notifySubscribersAboutPublishedArticle({
      slug: 's',
      title: 'T',
      excerpt: '',
    });

    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();
  });
});

describe('enqueueNewsPublishedNotifications', () => {
  beforeEach(() => {
    vi.mocked(mailResend.sendEmailViaResend).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(mailResend.resolveMailSenderAddress).mockReturnValue('Boletim <noreply@test.pt>');
    findMany.mockReset();
    findMany.mockResolvedValue([{ email: 'sub@test.pt' }]);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://enqueue.test';
    process.env.RESEND_API_KEY = 're_enqueue';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.RESEND_API_KEY;
  });

  it('executa envio por microtask sem bloquear a chamada síncrona', async () => {
    newsletter.enqueueNewsPublishedNotifications(null, {
      slug: 'nova',
      title: 'Título novo',
      excerpt: '<p>Resumo</p>',
      published: true,
    });

    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();

    await vi.waitUntil(() => vi.mocked(mailResend.sendEmailViaResend).mock.calls.length > 0, { timeout: 500 });

    expect(mailResend.sendEmailViaResend).toHaveBeenCalled();
    expect(vi.mocked(mailResend.sendEmailViaResend).mock.calls[0][0].subject).toBe('Nova notícia: Título novo');
  });

  it('não agenda envio quando não é primeira publicação', async () => {
    newsletter.enqueueNewsPublishedNotifications(true, {
      slug: 'x',
      title: 'y',
      excerpt: '',
      published: true,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();
  });
});
