import { describe, expect, it } from 'vitest';
import { deepMergeSettings, defaultSiteLayoutSettings } from '@/lib/site-layout';

describe('site-layout', () => {
  it('deep merges object branches and replaces arrays', () => {
    const merged = deepMergeSettings(defaultSiteLayoutSettings, {
      home: {
        hero: {
          titleLine1: 'Novo título',
        },
        explore: {
          links: [{ label: 'Teste', href: '/x', title: 'Teste', description: 'desc', icon: 'Users' }],
        },
      },
    });

    expect(merged.home.hero.titleLine1).toBe('Novo título');
    expect(merged.home.hero.titleLine2).toBe(defaultSiteLayoutSettings.home.hero.titleLine2);
    expect(merged.home.explore.links).toHaveLength(1);
  });
});
