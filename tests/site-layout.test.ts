import { describe, expect, it } from 'vitest';
import { deepMergeSettings, defaultSiteLayoutSettings, normalizeSiteLayoutSettings } from '@/lib/site-layout';

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

  it('does not place a long administrative mission paragraph below the footer logo', () => {
    expect(defaultSiteLayoutSettings.footer.brandDescription).toBe('');
  });

  it('labels the public resource area consistently', () => {
    expect(defaultSiteLayoutSettings.pages.biblioteca.title).toBe('Recursos');
    expect(defaultSiteLayoutSettings.home.explore.links).toContainEqual(
      expect.objectContaining({ label: 'Recursos', href: '/biblioteca' })
    );
  });

  it('keeps footer contact details in editable layout settings', () => {
    expect(defaultSiteLayoutSettings.footer.contactInfo.email).toBe('ceiscaramulo@gmail.com');
    expect(defaultSiteLayoutSettings.footer.contactInfo.phone).toBe('+351 966 717 360');
    expect(defaultSiteLayoutSettings.footer.contactInfo.socialMedia.instagram).toBe('https://www.instagram.com/ceiscaramulo_/');
  });

  it('replaces placeholder footer column titles with the public defaults', () => {
    const settings = normalizeSiteLayoutSettings({
      ...defaultSiteLayoutSettings,
      footer: {
        ...defaultSiteLayoutSettings.footer,
        columns: [
          {
            ...defaultSiteLayoutSettings.footer.columns[0],
            title: 'Teste',
          },
          {
            ...defaultSiteLayoutSettings.footer.columns[1],
            title: 'Explorar',
          },
        ],
      },
    });

    expect(settings.footer.columns[0].title).toBe('Conhecer');
    expect(settings.footer.columns[1].title).toBe('Explorar');
  });

  it('defines editable visual identity and SEO defaults for the appearance CMS', () => {
    expect(defaultSiteLayoutSettings.visualIdentity.colors.primary).toBe('#27441d');
    expect(defaultSiteLayoutSettings.visualIdentity.colors.buttons).toBe('#27441d');
    expect(defaultSiteLayoutSettings.visualIdentity.logos.primary).toBe('/ceiscaramulo-logo.svg');
    expect(defaultSiteLayoutSettings.seo.title).toContain('CEISCaramulo');
    expect(defaultSiteLayoutSettings.seo.ogImage).toBe('/og-image.svg');
  });

  it('defines editable page intros for the public frontend pages', () => {
    expect(defaultSiteLayoutSettings.pages.contactos.title).toBe('Fale connosco.');
    expect(defaultSiteLayoutSettings.pages.galeria.title).toBe('Galeria Multimédia');
    expect(defaultSiteLayoutSettings.pages.bibliotecaJrs.title).toBe('Biblioteca JRS');
    expect(defaultSiteLayoutSettings.pages.oficinaDoBurel.title).toBe('Oficina do Burel');
    expect(defaultSiteLayoutSettings.pages.ponDoJueus.title).toBe('PON do Jueus');
    expect(defaultSiteLayoutSettings.pages.escolaDosNossosAvos.title).toBe('Escola dos Nossos Avós');
    expect(defaultSiteLayoutSettings.pages.oficinasDeFormacao.title).toBe('Oficinas de formação');
    expect(defaultSiteLayoutSettings.pages.publicacoes.title).toBe('Publicações');
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
