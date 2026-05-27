import { describe, expect, it } from 'vitest';
import { deepMergeSettings, defaultSiteLayoutSettings } from '@/lib/site-layout';

describe('site-layout', () => {
  it('uses the requested homepage hero phrase by default', () => {
    expect(defaultSiteLayoutSettings.home.hero.description).toBe(
      'Centro de estudos e interpretação da Serra do Caramulo'
    );
  });

  it('default explore links omit the old Projetos highlight', () => {
    const hrefs = defaultSiteLayoutSettings.home.explore.links.map((link) => link.href);
    expect(hrefs).not.toContain('/projetos');
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps restricted admin links out of the default public footer', () => {
    const footerLinks = defaultSiteLayoutSettings.footer.columns.flatMap((column) => column.links);

    expect(defaultSiteLayoutSettings.footer.columns.map((column) => column.title)).not.toContain('Área Restrita');
    expect(footerLinks.map((link) => link.href)).not.toContain('/backoffice');
    expect(footerLinks.map((link) => link.href)).not.toContain('/backoffice/login');
  });

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
