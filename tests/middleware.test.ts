/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

const middlewareMock = vi.fn();

vi.mock('@/lib/auth0', () => ({
  auth0: {
    middleware: middlewareMock,
  },
}));

describe('auth middleware', () => {
  it('runs the Auth0 middleware on the Node.js runtime', async () => {
    const middlewareModule = await import('@/middleware');

    expect(middlewareModule.runtime).toBe('nodejs');
  });

  it('keeps uploaded media routes public so frontend images can render', async () => {
    const { config } = await import('@/middleware');
    const matcher = config.matcher.join(' ');

    expect(matcher).toContain('uploads/backoffice');
    expect(matcher).toContain('api/content-assets');
    expect(matcher).toContain('api/layout/hero-image');
    expect(matcher).toContain('api/gallery/assets');
  });

  it('forwards the request through the Auth0 middleware', async () => {
    const response = new Response(null, { status: 204 });
    middlewareMock.mockResolvedValue(response);

    const { middleware } = await import('@/middleware');
    const request = new Request('http://localhost/backoffice');

    await expect(middleware(request as never)).resolves.toBe(response);
    expect(middlewareMock).toHaveBeenCalledWith(request);
  });
});
