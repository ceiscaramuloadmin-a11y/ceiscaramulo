/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_HERO_IMAGE_ROUTE } from '@/lib/site-layout-settings';

const { siteLayoutFindUnique, siteSettingFindUnique } = vi.hoisted(() => ({
  siteLayoutFindUnique: vi.fn(),
  siteSettingFindUnique: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    siteLayout: {
      findUnique: siteLayoutFindUnique,
    },
    siteSetting: {
      findUnique: siteSettingFindUnique,
    },
  },
}));

describe('public site layout settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('uses siteLayout JSON value when available', async () => {
    siteLayoutFindUnique.mockResolvedValue({
      value: {
        home: {
          hero: {
            imageUrl: 'data:image/png;base64,hero-image',
            titleLine1: 'Hero from DB',
          },
        },
      },
    });

    const { getPublicSiteLayoutSettings } = await import('@/lib/site-layout-settings');
    const settings = await getPublicSiteLayoutSettings();

    expect(settings.home.hero.imageUrl).toBe(PUBLIC_HERO_IMAGE_ROUTE);
    expect(settings.home.hero.titleLine1).toBe('Hero from DB');
    expect(siteSettingFindUnique).not.toHaveBeenCalled();
  });

  it('falls back to siteSetting string JSON when siteLayout is empty', async () => {
    siteLayoutFindUnique.mockResolvedValue(null);
    siteSettingFindUnique.mockResolvedValue({
      value: JSON.stringify({
        home: {
          hero: {
            imageUrl: 'data:image/jpeg;base64,legacy-hero',
          },
        },
      }),
    });

    const { getPublicSiteLayoutSettings } = await import('@/lib/site-layout-settings');
    const settings = await getPublicSiteLayoutSettings();

    expect(settings.home.hero.imageUrl).toBe(PUBLIC_HERO_IMAGE_ROUTE);
  });

  it('replaces the old stored footer brand description with the requested text', async () => {
    siteLayoutFindUnique.mockResolvedValue({
      value: {
        footer: {
          brandDescription:
            'Promovendo o estudo, a preservação e a valorização do património natural e cultural da Serra do Caramulo.',
        },
      },
    });

    const { getPublicSiteLayoutSettings } = await import('@/lib/site-layout-settings');
    const settings = await getPublicSiteLayoutSettings();

    expect(settings.footer.brandDescription).toBe('');
  });
});
