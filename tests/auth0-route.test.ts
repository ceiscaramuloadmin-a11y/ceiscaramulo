/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

const middleware = vi.fn();

vi.mock('@/lib/auth0', () => ({
  auth0: {
    middleware,
  },
}));

describe('Auth0 app routes', () => {
  it('mounts GET auth routes explicitly for production deployments', async () => {
    const response = new Response(null, { status: 302, headers: { location: 'https://auth.example/login' } });
    middleware.mockResolvedValueOnce(response);

    const { GET, runtime } = await import('@/app/auth/[auth0]/route');
    const request = new Request('https://www.ceiscaramulo.pt/auth/login?returnTo=%2Fbackoffice');

    await expect(GET(request as never)).resolves.toBe(response);
    expect(runtime).toBe('nodejs');
    expect(middleware).toHaveBeenCalledWith(request);
  });

  it('mounts POST auth routes for callback-compatible SDK handlers', async () => {
    const response = new Response(null, { status: 204 });
    middleware.mockResolvedValueOnce(response);

    const { POST } = await import('@/app/auth/[auth0]/route');
    const request = new Request('https://www.ceiscaramulo.pt/auth/backchannel-logout', { method: 'POST' });

    await expect(POST(request as never)).resolves.toBe(response);
    expect(middleware).toHaveBeenCalledWith(request);
  });
});
