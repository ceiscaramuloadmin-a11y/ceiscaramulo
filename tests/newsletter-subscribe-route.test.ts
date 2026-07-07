/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const { upsert, sendNewsletterInternalNotification, sendNewsletterSubscriptionConfirmation } = vi.hoisted(() => ({
  upsert: vi.fn(),
  sendNewsletterInternalNotification: vi.fn(),
  sendNewsletterSubscriptionConfirmation: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    newsletterSubscriber: { upsert },
  },
}));

vi.mock('@/lib/newsletter-on-publish', () => ({
  sendNewsletterInternalNotification,
  sendNewsletterSubscriptionConfirmation,
}));

describe('newsletter subscribe route', () => {
  afterEach(() => {
    vi.resetModules();
    upsert.mockReset();
    sendNewsletterInternalNotification.mockReset();
    sendNewsletterSubscriptionConfirmation.mockReset();
  });

  it('stores the normalized email successfully', async () => {
    upsert.mockResolvedValue({ id: 'sub_1' });
    sendNewsletterInternalNotification.mockResolvedValue({ ok: true });
    sendNewsletterSubscriptionConfirmation.mockResolvedValue({ ok: true });

    const { POST } = await import('@/app/api/newsletter/subscribe/route');

    const response = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'MARIA@test.PT ' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(upsert).toHaveBeenCalledWith({
      where: { email: 'maria@test.pt' },
      create: { email: 'maria@test.pt' },
      update: {},
    });
    expect(sendNewsletterSubscriptionConfirmation).toHaveBeenCalledWith('maria@test.pt');
    expect(sendNewsletterInternalNotification).toHaveBeenCalledWith('maria@test.pt');
  });

  it('accepts form submissions from the newsletter button', async () => {
    upsert.mockResolvedValue({ id: 'sub_2' });
    sendNewsletterInternalNotification.mockResolvedValue({ ok: true });
    sendNewsletterSubscriptionConfirmation.mockResolvedValue({ ok: true });

    const { POST } = await import('@/app/api/newsletter/subscribe/route');
    const formData = new FormData();
    formData.append('newsletter-email', 'JOAO@EXAMPLE.PT');

    const response = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: formData,
      })
    );

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith({
      where: { email: 'joao@example.pt' },
      create: { email: 'joao@example.pt' },
      update: {},
    });
    expect(sendNewsletterSubscriptionConfirmation).toHaveBeenCalledWith('joao@example.pt');
    expect(sendNewsletterInternalNotification).toHaveBeenCalledWith('joao@example.pt');
  });

  it('shows a simple saved message when the confirmation email cannot be sent', async () => {
    upsert.mockResolvedValue({ id: 'sub_3' });
    sendNewsletterInternalNotification.mockResolvedValue({ ok: true });
    sendNewsletterSubscriptionConfirmation.mockResolvedValue({ ok: false, reason: 'missing_api_key' });

    const { POST } = await import('@/app/api/newsletter/subscribe/route');
    const response = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ana@site.pt' }),
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      message: 'Email guardado com sucesso. Para qualquer questão, contacta o CEISCaramulo.',
    });
  });

  it('still stores the subscription when the internal notification cannot be sent', async () => {
    upsert.mockResolvedValue({ id: 'sub_4' });
    sendNewsletterSubscriptionConfirmation.mockResolvedValue({ ok: true });
    sendNewsletterInternalNotification.mockResolvedValue({ ok: false, reason: 'missing_api_key' });

    const { POST } = await import('@/app/api/newsletter/subscribe/route');
    const response = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'aviso@site.pt' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(sendNewsletterInternalNotification).toHaveBeenCalledWith('aviso@site.pt');
  });

  it('rejects payloads without a usable email shape', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route');
    const response = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'não-email' }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 503 when the database rejects the write', async () => {
    upsert.mockRejectedValue(new Error('db offline'));

    const { POST } = await import('@/app/api/newsletter/subscribe/route');
    const response = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'fallback@site.pt' }),
      })
    );

    expect(response.status).toBe(503);
  });
});
