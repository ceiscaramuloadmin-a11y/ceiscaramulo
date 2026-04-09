import prisma from '@/lib/prisma';
import { defaultSiteLayoutSettings, deepMergeSettings, SITE_LAYOUT_SETTINGS_KEY } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

const SITE_LAYOUT_RETRY_DELAY_MS = 5 * 60 * 1000;

let siteLayoutRetryAfter = 0;

function isQuotaExceededError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    String((error as { message?: string }).message || '').includes('exceeded the data transfer quota')
  );
}

// Carrega definições públicas de layout com fallback para os valores por omissão.
export async function getPublicSiteLayoutSettings(): Promise<SiteLayoutSettings> {
  if (siteLayoutRetryAfter > Date.now()) {
    return defaultSiteLayoutSettings;
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_LAYOUT_SETTINGS_KEY },
    });

    if (!setting?.value) {
      return defaultSiteLayoutSettings;
    }

    try {
      const parsed = JSON.parse(setting.value) as unknown;
      return deepMergeSettings(defaultSiteLayoutSettings, parsed);
    } catch {
      return defaultSiteLayoutSettings;
    }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      siteLayoutRetryAfter = Date.now() + SITE_LAYOUT_RETRY_DELAY_MS;
      console.warn('Neon quota exceeded while loading public site layout; using default layout settings.');
      return defaultSiteLayoutSettings;
    }

    console.warn('Error fetching public site layout settings; using defaults.');
    return defaultSiteLayoutSettings;
  }
}
