/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    newsletterSubscriber: { upsert },
  },
}));

describe('newsletter subscribe route', () => {
  afterEach(() => {
    vi.resetModules();
    upsert.mockReset();
  });

  it('stores the normalized email successfully', async () => {
    upsert.mockResolvedValue({ id: 'sub_1' });

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
