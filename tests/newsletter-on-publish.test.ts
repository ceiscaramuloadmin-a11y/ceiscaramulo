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
  it('does not announce unpublished news', () => {
    expect(newsletter.shouldAnnounceNewsEmail(null, false)).toBe(false);
    expect(newsletter.shouldAnnounceNewsEmail(true, false)).toBe(false);
    expect(newsletter.shouldAnnounceNewsEmail(false, false)).toBe(false);
  });

  it('announces a new item that is already published', () => {
    expect(newsletter.shouldAnnounceNewsEmail(null, true)).toBe(true);
  });

  it('announces the draft to published transition', () => {
    expect(newsletter.shouldAnnounceNewsEmail(false, true)).toBe(true);
  });

  it('does not announce when the item was already published', () => {
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
    delete process.env.APP_BASE_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.APP_BASE_URL;
  });

  it('sends one email per subscriber with the expected public link', async () => {
    findMany.mockResolvedValue([{ email: 'a@test.pt' }, { email: 'b@test.pt' }]);

    const result = await newsletter.notifySubscribersAboutPublishedArticle({
      slug: 'minha-slug',
      title: 'Titulo',
      excerpt: '<p>Ola mundo</p>',
    });

    expect(result).toEqual({ attempted: true, sent: 2, failed: 0 });
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(mailResend.sendEmailViaResend).toHaveBeenCalledTimes(2);

    const firstPayload = vi.mocked(mailResend.sendEmailViaResend).mock.calls[0][0];
    expect(firstPayload).toMatchObject({
      from: 'Boletim <noreply@test.pt>',
      to: 'a@test.pt',
      subject: 'Nova notícia: Titulo',
    });
    expect(firstPayload.html).toContain('https://mysite.pt/noticias/minha-slug');
    expect(firstPayload.text).toContain('https://mysite.pt/noticias/minha-slug');
  });

  it('does not query subscribers or send mail without a sender address', async () => {
    vi.mocked(mailResend.resolveMailSenderAddress).mockReturnValue(null);
    findMany.mockResolvedValue([{ email: 'a@test.pt' }]);

    const result = await newsletter.notifySubscribersAboutPublishedArticle({
      slug: 's',
      title: 'T',
      excerpt: '',
    });

    expect(result).toMatchObject({ attempted: false, skippedReason: 'missing_sender' });
    expect(findMany).not.toHaveBeenCalled();
    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();
  });

  it('does not call Resend when there are no subscribers', async () => {
    findMany.mockResolvedValue([]);

    const result = await newsletter.notifySubscribersAboutPublishedArticle({
      slug: 's',
      title: 'T',
      excerpt: '',
    });

    expect(result).toMatchObject({ attempted: false, skippedReason: 'no_subscribers' });
    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();
  });
});

describe('notifySubscribersAboutPublishedActivity', () => {
  beforeEach(() => {
    findMany.mockReset();
    vi.mocked(mailResend.sendEmailViaResend).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(mailResend.resolveMailSenderAddress).mockReset().mockReturnValue('Boletim <noreply@test.pt>');
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mysite.pt';
    process.env.RESEND_API_KEY = 're_test';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('sends activity emails with the expected public activity link', async () => {
    findMany.mockResolvedValue([{ email: 'a@test.pt' }]);

    const result = await newsletter.notifySubscribersAboutPublishedActivity({
      id: 'act-123',
      title: 'Caminhada',
      description: '<p>Vamos caminhar na Serra.</p>',
    });

    expect(result).toEqual({ attempted: true, sent: 1, failed: 0 });
    const firstPayload = vi.mocked(mailResend.sendEmailViaResend).mock.calls[0][0];
    expect(firstPayload).toMatchObject({
      from: 'Boletim <noreply@test.pt>',
      to: 'a@test.pt',
      subject: 'Nova atividade: Caminhada',
    });
    expect(firstPayload.html).toContain('https://mysite.pt/atividades/act-123');
    expect(firstPayload.text).toContain('https://mysite.pt/atividades/act-123');
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

  it('sends the announcement before the call finishes', async () => {
    const result = await newsletter.enqueueNewsPublishedNotifications(null, {
      slug: 'nova',
      title: 'Titulo novo',
      excerpt: '<p>Resumo</p>',
      published: true,
    });

    expect(result).toEqual({ attempted: true, sent: 1, failed: 0 });
    expect(mailResend.sendEmailViaResend).toHaveBeenCalled();
    expect(vi.mocked(mailResend.sendEmailViaResend).mock.calls[0][0].subject).toBe('Nova notícia: Titulo novo');
  });

  it('does not send when this is not the first publication', async () => {
    const result = await newsletter.enqueueNewsPublishedNotifications(true, {
      slug: 'x',
      title: 'y',
      excerpt: '',
      published: true,
    });

    expect(result).toMatchObject({ attempted: false, skippedReason: 'not_first_publish' });
    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();
  });
});

describe('enqueueActivityPublishedNotifications', () => {
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

  it('sends an activity announcement on first publication only', async () => {
    const result = await newsletter.enqueueActivityPublishedNotifications(false, {
      id: 'a1',
      title: 'Atividade nova',
      description: '<p>Resumo</p>',
      published: true,
    });

    expect(result).toEqual({ attempted: true, sent: 1, failed: 0 });
    expect(vi.mocked(mailResend.sendEmailViaResend).mock.calls[0][0].subject).toBe('Nova atividade: Atividade nova');

    vi.mocked(mailResend.sendEmailViaResend).mockClear();

    const skipped = await newsletter.enqueueActivityPublishedNotifications(true, {
      id: 'a1',
      title: 'Atividade nova',
      description: '<p>Resumo</p>',
      published: true,
    });

    expect(skipped).toMatchObject({ attempted: false, skippedReason: 'not_first_publish' });
    expect(mailResend.sendEmailViaResend).not.toHaveBeenCalled();
  });

  it('uses APP_BASE_URL as a fallback when newsletter site URL variables are absent', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    delete process.env.VERCEL_URL;
    process.env.APP_BASE_URL = 'https://app-base.test/';
    findMany.mockResolvedValue([{ email: 'a@test.pt' }]);

    await newsletter.notifySubscribersAboutPublishedArticle({
      slug: 'fallback-link',
      title: 'Titulo',
      excerpt: '<p>Resumo</p>',
    });

    const firstPayload = vi.mocked(mailResend.sendEmailViaResend).mock.calls[0][0];
    expect(firstPayload.html).toContain('https://app-base.test/noticias/fallback-link');
    expect(firstPayload.text).toContain('https://app-base.test/noticias/fallback-link');
  });
});
