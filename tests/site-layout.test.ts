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

  it('keeps the main footer navigation focused on activities and news', () => {
    const footerLinks = defaultSiteLayoutSettings.footer.columns.flatMap((column) => column.links);
    const footerHrefs = footerLinks.map((link) => link.href);

    expect(defaultSiteLayoutSettings.footer.columns[0].links.map((link) => link.href)).toEqual(['/atividades', '/noticias']);
    expect(defaultSiteLayoutSettings.footer.columns.map((column) => column.title)).toContain('Iniciativas');
    expect(footerHrefs).toEqual(expect.arrayContaining(['/oficina-do-burel', '/escola-dos-nossos-avos', '/pon-do-jueus']));
    expect(footerHrefs).toContain('/noticias');
    expect(footerHrefs).not.toContain('/sobre-nos');
    expect(footerHrefs).not.toContain('/projetos');
    expect(footerHrefs).not.toContain('/biblioteca');
    expect(footerHrefs).not.toContain('/serra-do-caramulo');
    expect(footerHrefs).not.toContain('/contactos');
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

  it('keeps the footer membership call to action editable in layout settings', () => {
    expect(defaultSiteLayoutSettings.footer.membership.title).toBe('Tornar-se sócio');
    expect(defaultSiteLayoutSettings.footer.membership.description).toBe('');
    expect(defaultSiteLayoutSettings.footer.membership.ctaLabel).toBe('Preencher formulário');
    expect(defaultSiteLayoutSettings.footer.membership.ctaHref).toBe('https://forms.gle/KQKtyjGUPhF5DNRJ8');
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

  it('removes old footer links for about, projects, resources, or the contact column', () => {
    const settings = normalizeSiteLayoutSettings({
      ...defaultSiteLayoutSettings,
      footer: {
        ...defaultSiteLayoutSettings.footer,
        columns: [
          {
            title: 'Antigos',
            links: [
              { label: 'Notícias', href: '/noticias' },
              { label: 'A Serra do Caramulo', href: '/serra-do-caramulo' },
              { label: 'Contactos', href: '/contactos' },
              { label: 'Recursos', href: '/biblioteca' },
            ],
          },
        ],
      },
    });

    expect(settings.footer.columns[0].links.map((link) => link.href)).toEqual(['/atividades', '/noticias']);
  });

  it('removes restricted footer columns and backoffice links from normalized settings', () => {
    const settings = normalizeSiteLayoutSettings({
      ...defaultSiteLayoutSettings,
      footer: {
        ...defaultSiteLayoutSettings.footer,
        columns: [
          ...defaultSiteLayoutSettings.footer.columns,
          {
            title: 'Área Restrita 2',
            links: [
              { label: 'Backoffice', href: '/backoffice' },
              { label: 'Login Administrativo', href: '/backoffice/login' },
            ],
          },
          {
            title: 'Misto',
            links: [
              { label: 'Galeria', href: '/galeria' },
              { label: 'Backoffice', href: '/backoffice' },
            ],
          },
        ],
      },
    });

    expect(settings.footer.columns.map((column) => column.title)).not.toContain('Área Restrita 2');
    expect(settings.footer.columns.flatMap((column) => column.links.map((link) => link.href))).not.toContain('/backoffice');
    expect(settings.footer.columns.flatMap((column) => column.links.map((link) => link.href))).not.toContain('/backoffice/login');
    expect(settings.footer.columns.find((column) => column.title === 'Misto')?.links).toEqual([{ label: 'Galeria', href: '/galeria' }]);
  });

  it('defines editable visual identity and SEO defaults for the appearance CMS', () => {
    expect(defaultSiteLayoutSettings.visualIdentity.colors.primary).toBe('#0f4c36');
    expect(defaultSiteLayoutSettings.visualIdentity.colors.buttons).toBe('#0f4c36');
    expect(defaultSiteLayoutSettings.visualIdentity.colors.links).toBe('#0f4c36');
    expect(defaultSiteLayoutSettings.visualIdentity.colors.titles).toBe('#0f4c36');
    expect(defaultSiteLayoutSettings.visualIdentity.logos.primary).toBe('/ceiscaramulo-logo.svg');
    expect(defaultSiteLayoutSettings.seo.title).toContain('CEISCaramulo');
    expect(defaultSiteLayoutSettings.seo.ogImage).toBe('/og-image.svg');
  });

  it('normalizes old stored green tones to the logo green', () => {
    const settings = normalizeSiteLayoutSettings({
      ...defaultSiteLayoutSettings,
      visualIdentity: {
        ...defaultSiteLayoutSettings.visualIdentity,
        colors: {
          ...defaultSiteLayoutSettings.visualIdentity.colors,
          primary: '#27441d',
          buttons: '#3e5c32',
          titles: '#9dc44d',
        },
      },
    });

    expect(settings.visualIdentity.colors.primary).toBe('#0f4c36');
    expect(settings.visualIdentity.colors.buttons).toBe('#0f4c36');
    expect(settings.visualIdentity.colors.titles).toBe('#0f4c36');
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

  it('defines editable Sobre Nos body defaults for the dedicated backoffice page', () => {
    expect(defaultSiteLayoutSettings.aboutPage.whoWeAreTitle).toBe('Quem Somos');
    expect(defaultSiteLayoutSettings.aboutPage.whoWeAreParagraphs.join('\n')).toContain('associação legalmente constituída');
    expect(defaultSiteLayoutSettings.aboutPage.originParagraphs.join('\n')).toContain('Prémio Escolar Montepio 2011');
    expect(defaultSiteLayoutSettings.aboutPage.foundersTitle).toBe('Fundadores');
    expect(defaultSiteLayoutSettings.aboutPage.socialBodiesTitle).toBe('Corpos Sociais');
    expect(defaultSiteLayoutSettings.aboutPage.socialBodies).toContainEqual(
      expect.objectContaining({
        title: 'Direção',
        members: expect.arrayContaining(['Presidente: Luís Filipe Rodrigues da Costa']),
      })
    );
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
