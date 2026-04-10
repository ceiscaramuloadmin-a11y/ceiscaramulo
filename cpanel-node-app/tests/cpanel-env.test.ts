import { describe, expect, it } from 'vitest';
import { getCpanelRuntimeConfig } from '@/lib/cpanel-config';

describe('cpanel runtime config', () => {
  it('parses the required cPanel environment values', () => {
    expect(
      getCpanelRuntimeConfig({
        NEXT_PUBLIC_API_BASE_URL: 'https://ceiscaramulo.exemplo.com',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXT_PUBLIC_ADMIN_AUTH_MODE: 'runtime',
        UPLOADS_DIR: 'uploads',
      })
    ).toEqual({
      appUrl: 'https://ceiscaramulo.exemplo.com',
      databaseUrl: 'postgresql://user:pass@localhost:5432/db',
      authMode: 'runtime',
      uploadsDir: 'uploads',
    });
  });

  it('fails loudly when mandatory variables are missing', () => {
    expect(() => getCpanelRuntimeConfig({ DATABASE_URL: 'postgresql://x' })).toThrow(
      'NEXT_PUBLIC_API_BASE_URL is required for cPanel deployment.'
    );
  });
});
