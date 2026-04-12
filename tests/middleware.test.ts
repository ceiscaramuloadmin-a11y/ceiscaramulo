/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

const middlewareMock = vi.fn();

vi.mock('@/lib/auth0', () => ({
  auth0: {
    middleware: middlewareMock,
  },
}));

describe('auth middleware', () => {
  it('forwards the request through the Auth0 middleware', async () => {
    const response = new Response(null, { status: 204 });
    middlewareMock.mockResolvedValue(response);

    const { middleware } = await import('@/middleware');
    const request = new Request('http://localhost/backoffice');

    await expect(middleware(request as never)).resolves.toBe(response);
    expect(middlewareMock).toHaveBeenCalledWith(request);
  });
});
