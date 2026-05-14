import prisma from '@/lib/prisma';
import { defaultSiteLayoutSettings, deepMergeSettings, SITE_LAYOUT_SETTINGS_KEY } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

const SITE_LAYOUT_RETRY_DELAY_MS = 5 * 60 * 1000;
export const PUBLIC_HERO_IMAGE_ROUTE = '/api/layout/hero-image';

let siteLayoutRetryAfter = 0;

function isQuotaExceededError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    String((error as { message?: string }).message || '').includes('exceeded the data transfer quota')
  );
}

function normalizePublicHeroImageUrl(imageUrl: string) {
  const normalized = (imageUrl || '').trim();

  if (!normalized.startsWith('data:')) {
    return normalized;
  }

  return PUBLIC_HERO_IMAGE_ROUTE;
}

function normalizePublicLayoutSettings(settings: SiteLayoutSettings): SiteLayoutSettings {
  return {
    ...settings,
    home: {
      ...settings.home,
      hero: {
        ...settings.home.hero,
        imageUrl: normalizePublicHeroImageUrl(settings.home.hero.imageUrl),
      },
    },
  };
}

// Carrega definições públicas de layout com fallback para os valores por omissão.
export async function getPublicSiteLayoutSettings(): Promise<SiteLayoutSettings> {
  if (siteLayoutRetryAfter > Date.now()) {
    return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
  }

  try {
    const prismaAny = prisma as unknown as {
      siteLayout?: {
        findUnique: (args: { where: { key: string } }) => Promise<{ value: unknown } | null>;
      };
      siteSetting: {
        findUnique: (args: { where: { key: string } }) => Promise<{ value: string } | null>;
      };
    };

    const layoutFromJsonColumn = prismaAny.siteLayout
      ? await prismaAny.siteLayout.findUnique({ where: { key: 'global' } })
      : null;

    if (layoutFromJsonColumn?.value) {
      return normalizePublicLayoutSettings(deepMergeSettings(defaultSiteLayoutSettings, layoutFromJsonColumn.value));
    }

    const setting = await prismaAny.siteSetting.findUnique({ where: { key: SITE_LAYOUT_SETTINGS_KEY } });

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as unknown;
        return normalizePublicLayoutSettings(deepMergeSettings(defaultSiteLayoutSettings, parsed));
      } catch {
        return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
      }
    }

    return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      siteLayoutRetryAfter = Date.now() + SITE_LAYOUT_RETRY_DELAY_MS;
      console.warn('Database quota exceeded while loading public site layout; using default layout settings.');
      return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
    }

    console.warn('Error fetching public site layout settings; using defaults.');
    return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
  }
}
