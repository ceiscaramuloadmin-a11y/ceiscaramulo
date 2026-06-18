/* @vitest-environment node */

import { afterEach, describe, expect, it } from 'vitest';
import { getAssetUrl } from '@/lib/utils';

describe('getAssetUrl', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it('keeps backoffice upload URLs on the same origin when no API base URL is configured', () => {
    expect(getAssetUrl('/uploads/backoffice/news/foto.png')).toBe('/uploads/backoffice/news/foto.png');
  });

  it('prefixes backoffice upload URLs when an API base URL is configured', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.ceiscaramulo.pt/';

    expect(getAssetUrl('/uploads/backoffice/news/foto.png')).toBe(
      'https://api.ceiscaramulo.pt/uploads/backoffice/news/foto.png',
    );
  });
});
