/* @vitest-environment node */

import { describe, expect, it } from 'vitest';

describe('geologia pdf route', () => {
  it('serves the GeologiaCaramulo document inline as pdf', async () => {
    const { GET } = await import('@/app/api/docs/geologia-caramulo/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('inline');
  });
});
