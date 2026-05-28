import prisma from '@/lib/prisma';
import { defaultSiteLayoutSettings, deepMergeSettings, SITE_LAYOUT_SETTINGS_KEY } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

const SITE_LAYOUT_RETRY_DELAY_MS = 5 * 60 * 1000;
const OLD_FOOTER_BRAND_DESCRIPTION =
  'Promovendo o estudo, a preservação e a valorização do património natural e cultural da Serra do Caramulo.';
const REQUESTED_FOOTER_BRAND_DESCRIPTION =
  'promover o estudo e a investigação nos vários domínios e interesses, designadamente ambiental, geográfico, biológico, geológico, histórico, etnográfico, gastronómico, ..., da Serra do Caramulo';

let siteLayoutRetryAfter = 0;

function isQuotaExceededError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    String((error as { message?: string }).message || '').includes('exceeded the data transfer quota')
  );
}

function normalizePublicLayoutSettings(settings: SiteLayoutSettings): SiteLayoutSettings {
  return {
    ...settings,
    footer: {
      ...settings.footer,
      brandDescription:
        settings.footer.brandDescription === OLD_FOOTER_BRAND_DESCRIPTION
          ? REQUESTED_FOOTER_BRAND_DESCRIPTION
          : settings.footer.brandDescription,
    },
  };
}

// Carrega definições públicas de layout com fallback para os valores por omissão.
export async function getPublicSiteLayoutSettings(): Promise<SiteLayoutSettings> {
  if (siteLayoutRetryAfter > Date.now()) {
    return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_LAYOUT_SETTINGS_KEY },
    });

    if (!setting?.value) {
      return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
    }

    try {
      const parsed = JSON.parse(setting.value) as unknown;
      return normalizePublicLayoutSettings(deepMergeSettings(defaultSiteLayoutSettings, parsed));
    } catch {
      return normalizePublicLayoutSettings(defaultSiteLayoutSettings);
    }
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
