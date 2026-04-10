export type CpanelRuntimeConfig = {
  appUrl: string;
  databaseUrl: string;
  authMode: 'runtime' | 'export';
  uploadsDir: string;
};

export function getCpanelRuntimeConfig(env: NodeJS.ProcessEnv): CpanelRuntimeConfig {
  const appUrl = String(env.NEXT_PUBLIC_API_BASE_URL || '').trim();
  const databaseUrl = String(env.DATABASE_URL || '').trim();
  const authMode = env.NEXT_PUBLIC_ADMIN_AUTH_MODE === 'export' ? 'export' : 'runtime';
  const uploadsDir = String(env.UPLOADS_DIR || 'uploads').trim() || 'uploads';

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required for cPanel deployment.');
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for cPanel deployment.');
  }

  return {
    appUrl,
    databaseUrl,
    authMode,
    uploadsDir,
  };
}
