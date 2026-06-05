/* @vitest-environment node */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sobreNosPageSource = readFileSync(resolve(process.cwd(), 'app/sobre-nos/page.tsx'), 'utf8');
const serraPageSource = readFileSync(resolve(process.cwd(), 'app/serra-do-caramulo/page.tsx'), 'utf8');
const backofficePageSource = readFileSync(resolve(process.cwd(), 'app/backoffice/page.tsx'), 'utf8');
const escolaDosNossosAvosPageSource = readFileSync(resolve(process.cwd(), 'app/escola-dos-nossos-avos/page.tsx'), 'utf8');
const ponDoJueusPageSource = readFileSync(resolve(process.cwd(), 'app/pon-do-jueus/page.tsx'), 'utf8');
const contactosPageSource = readFileSync(resolve(process.cwd(), 'app/contactos/page.tsx'), 'utf8');
const galeriaPageSource = readFileSync(resolve(process.cwd(), 'app/galeria/page.tsx'), 'utf8');
const institutionalProgrammePageSource = readFileSync(resolve(process.cwd(), 'components/InstitutionalProgrammePage.tsx'), 'utf8');

const requestedProgrammePages = [
  ['oficinaDoBurel', 'app/oficina-do-burel/page.tsx'],
  ['ponDoJueus', 'app/pon-do-jueus/page.tsx'],
  ['escolaDosNossosAvos', 'app/escola-dos-nossos-avos/page.tsx'],
  ['bibliotecaJrs', 'app/biblioteca-jrs/page.tsx'],
  ['oficinasDeFormacao', 'app/oficinas-de-formacao/page.tsx'],
  ['publicacoes', 'app/publicacoes/page.tsx'],
];

describe('institutional pages', () => {
  it('renders the updated CEISCaramulo institutional history and social bodies on sobre nós', () => {
    expect(sobreNosPageSource).toContain('associação legalmente constituída');
    expect(sobreNosPageSource).toContain('Prémio Escolar Montepio 2011');
    expect(sobreNosPageSource).toContain('Mesa da Assembleia Geral');
    expect(sobreNosPageSource).toContain('Direção');
    expect(sobreNosPageSource).toContain('Conselho Fiscal');
    expect(sobreNosPageSource).toContain('Luís Filipe Rodrigues da Costa');
    expect(sobreNosPageSource).not.toContain('Desde {siteConfig.founded}');
    expect(sobreNosPageSource).not.toContain('Um projeto dedicado a estudar, interpretar e valorizar a Serra do Caramulo.');
  });

  it('embeds only the GeologiaCaramulo pdf inside the Serra do Caramulo page container', () => {
    expect(serraPageSource).toContain("const pdfUrl = '/api/docs/geologia-caramulo'");
    expect(serraPageSource).toContain('<iframe');
    expect(serraPageSource).toContain('Preview do documento GeologiaCaramulo');
    expect(serraPageSource).not.toContain('layout.serra.sections.map');
  });

  it('allows the logged-in admin to change their own password from the overview', () => {
    expect(backofficePageSource).toContain('Segurança da conta');
    expect(backofficePageSource).toContain('Nova palavra-passe');
    expect(backofficePageSource).toContain('Confirmar nova palavra-passe');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<{ success: boolean }>('/api/admin/password'");
  });

  it('provides editable pages for the new navbar programme links', () => {
    requestedProgrammePages.forEach(([pageKey, relativePath]) => {
      const pagePath = resolve(process.cwd(), relativePath);
      const pageSource = readFileSync(pagePath, 'utf8');

      expect(existsSync(pagePath)).toBe(true);
      expect(pageSource).toContain('getPublicSiteLayoutSettings');
      expect(pageSource).toContain(`layout.pages.${pageKey}.title`);
      expect(pageSource).toContain(`layout.pages.${pageKey}.description`);
    });
  });

  it('renders Escola dos Nossos Avos content from its backoffice gallery context', () => {
    expect(escolaDosNossosAvosPageSource).toContain("listGalleryMedia('public', 'escola-dos-nossos-avos')");
    expect(escolaDosNossosAvosPageSource).toContain('<GalleryTabs items={media} />');
    expect(escolaDosNossosAvosPageSource).toContain('Conteúdos da Escola dos Nossos Avós');
    expect(escolaDosNossosAvosPageSource).not.toContain('publicados no backoffice');
    expect(institutionalProgrammePageSource).toContain('children?: React.ReactNode');
    expect(institutionalProgrammePageSource).toContain('{children}');
  });

  it('renders PON do Jueus content from its backoffice gallery context', () => {
    expect(ponDoJueusPageSource).toContain("listGalleryMedia('public', 'pon-do-jueus')");
    expect(ponDoJueusPageSource).toContain('<GalleryTabs items={media} />');
    expect(ponDoJueusPageSource).toContain('Conteúdos do PON do Jueus');
  });

  it('renders contact, gallery and Serra intros from appearance settings', () => {
    expect(contactosPageSource).toContain('layout.pages.contactos.title');
    expect(contactosPageSource).toContain('layout.pages.contactos.description');
    expect(galeriaPageSource).toContain('layout.pages.galeria.title');
    expect(galeriaPageSource).toContain('layout.pages.galeria.description');
    expect(serraPageSource).toContain('layout.pages.serra.description');
  });
});
