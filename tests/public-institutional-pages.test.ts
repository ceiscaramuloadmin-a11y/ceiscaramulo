/* @vitest-environment node */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sobreNosPageSource = readFileSync(resolve(process.cwd(), 'app/sobre-nos/page.tsx'), 'utf8');
const serraPageSource = readFileSync(resolve(process.cwd(), 'app/serra-do-caramulo/page.tsx'), 'utf8');
const backofficePageSource = readFileSync(resolve(process.cwd(), 'app/backoffice/page.tsx'), 'utf8');
const oficinaDoBurelPageSource = readFileSync(resolve(process.cwd(), 'app/oficina-do-burel/page.tsx'), 'utf8');
const artigosParaVendaPageSource = readFileSync(resolve(process.cwd(), 'app/artigos-para-venda/page.tsx'), 'utf8');
const escolaDosNossosAvosPageSource = readFileSync(resolve(process.cwd(), 'app/escola-dos-nossos-avos/page.tsx'), 'utf8');
const ponDoJueusPageSource = readFileSync(resolve(process.cwd(), 'app/pon-do-jueus/page.tsx'), 'utf8');
const bibliotecaJrsPageSource = readFileSync(resolve(process.cwd(), 'app/biblioteca-jrs/page.tsx'), 'utf8');
const oficinasDeFormacaoPageSource = readFileSync(resolve(process.cwd(), 'app/oficinas-de-formacao/page.tsx'), 'utf8');
const publicacoesPageSource = readFileSync(resolve(process.cwd(), 'app/publicacoes/page.tsx'), 'utf8');
const bibliotecaPageSource = readFileSync(resolve(process.cwd(), 'app/biblioteca/page.tsx'), 'utf8');
const contactosPageSource = readFileSync(resolve(process.cwd(), 'app/contactos/page.tsx'), 'utf8');
const galeriaPageSource = readFileSync(resolve(process.cwd(), 'app/galeria/page.tsx'), 'utf8');
const institutionalProgrammePageSource = readFileSync(resolve(process.cwd(), 'components/InstitutionalProgrammePage.tsx'), 'utf8');

const requestedProgrammePages = [
  ['oficinaDoBurel', 'app/oficina-do-burel/page.tsx'],
  ['artigosParaVenda', 'app/artigos-para-venda/page.tsx'],
  ['ponDoJueus', 'app/pon-do-jueus/page.tsx'],
  ['escolaDosNossosAvos', 'app/escola-dos-nossos-avos/page.tsx'],
  ['bibliotecaJrs', 'app/biblioteca-jrs/page.tsx'],
  ['oficinasDeFormacao', 'app/oficinas-de-formacao/page.tsx'],
  ['publicacoes', 'app/publicacoes/page.tsx'],
];

describe('institutional pages', () => {
  it('renders the updated CEISCaramulo institutional history and social bodies on sobre nós', () => {
    expect(sobreNosPageSource).toContain('layout.aboutPage.whoWeAreParagraphs.map');
    expect(sobreNosPageSource).toContain('layout.aboutPage.originParagraphs.map');
    expect(sobreNosPageSource).toContain('layout.aboutPage.foundersParagraphs.map');
    expect(sobreNosPageSource).toContain('socialBodies.map');
    expect(sobreNosPageSource).toContain('layout.aboutPage.socialBodiesTitle');
    expect(sobreNosPageSource).toContain('about.contactAddress');
    expect(sobreNosPageSource).toContain('about.contactPhone');
    expect(sobreNosPageSource).toContain('about.contactEmail');
    expect(sobreNosPageSource).not.toContain('contactInfo.email');
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

  it('uses contextual photo hero backgrounds on the personalized internal pages', () => {
    [
      ['public/internal-pages/escola-dos-nossos-avos.jpg', escolaDosNossosAvosPageSource, 'heroImage="/internal-pages/escola-dos-nossos-avos.jpg"'],
      ['public/internal-pages/oficina-do-burel.jpg', oficinaDoBurelPageSource, 'heroImage="/internal-pages/oficina-do-burel.jpg"'],
      ['src/assets/hero-imgs/hero-oficina-burel-sapatos.jpg', artigosParaVendaPageSource, 'heroImage={salesHeroImage.src}'],
      ['public/internal-pages/pon-do-jueus.jpg', ponDoJueusPageSource, 'heroImage="/internal-pages/pon-do-jueus.jpg"'],
      ['public/internal-pages/sobre-nos.jpg', sobreNosPageSource, "const aboutHeroImage = '/internal-pages/sobre-nos.jpg'"],
      ['public/internal-pages/biblioteca.jpg', bibliotecaPageSource, "const bibliotecaHeroImage = '/internal-pages/biblioteca.jpg'"],
      ['public/internal-pages/biblioteca-jrs.jpg', bibliotecaJrsPageSource, 'heroImage="/internal-pages/biblioteca-jrs.jpg"'],
      ['public/internal-pages/oficinas-de-formacao.jpg', oficinasDeFormacaoPageSource, 'heroImage="/internal-pages/oficinas-de-formacao.jpg"'],
      ['public/internal-pages/publicacoes.jpg', publicacoesPageSource, 'heroImage="/internal-pages/publicacoes.jpg"'],
    ].forEach(([assetPath, pageSource, sourceNeedle]) => {
      expect(existsSync(resolve(process.cwd(), assetPath))).toBe(true);
      expect(pageSource).toContain(sourceNeedle);
    });

    expect(institutionalProgrammePageSource).toContain('heroImage?: string');
    expect(institutionalProgrammePageSource).toContain("heroTitleTone?: 'white' | 'green'");
    expect(institutionalProgrammePageSource).toContain('backgroundImage');
    expect(institutionalProgrammePageSource).not.toContain('linear-gradient');
    expect(institutionalProgrammePageSource).not.toContain('bg-[#0f4c36]/30');
    expect(institutionalProgrammePageSource).toContain('absolute inset-0 z-0 bg-black/45');
    expect(institutionalProgrammePageSource).toContain('min-h-[520px] w-full');
    expect(institutionalProgrammePageSource).not.toContain('rounded-full bg-black/35');
    expect(institutionalProgrammePageSource).toContain('font-display text-4xl font-bold leading-tight !text-white');
    expect(institutionalProgrammePageSource).toContain('tracking-[0.22em] text-white');
    expect(institutionalProgrammePageSource).toContain('leading-relaxed text-white');
    expect(institutionalProgrammePageSource).toContain('hover:!text-[#0f4c36]');
    expect(institutionalProgrammePageSource).toContain('[&_*]:!text-[#0f4c36]');
    expect(sobreNosPageSource).toContain('min-h-[520px] w-full');
    expect(sobreNosPageSource).not.toContain('linear-gradient');
    expect(sobreNosPageSource).not.toContain('bg-[#0f4c36]/30');
    expect(sobreNosPageSource).toContain('absolute inset-0 z-0 bg-black/45');
    expect(sobreNosPageSource).not.toContain('rounded-full bg-black/35');
    expect(sobreNosPageSource).toContain('font-display text-4xl font-bold leading-tight !text-white');
    expect(sobreNosPageSource).toContain('tracking-[0.22em] text-white');
    expect(sobreNosPageSource).toContain('leading-relaxed text-white');
    expect(sobreNosPageSource).toContain("bg-[#0f4c36]");
    expect(sobreNosPageSource).toContain("bg-[#f4f6ee]");
    expect(bibliotecaPageSource).toContain('min-h-[520px] w-full');
    expect(bibliotecaPageSource).toContain('backgroundImage');
    expect(bibliotecaPageSource).toContain('absolute inset-0 z-0 bg-black/45');
    expect(bibliotecaPageSource).toContain('font-display text-4xl font-bold leading-tight !text-white');
    expect(bibliotecaPageSource).toContain('tracking-[0.22em] text-white');
    expect(bibliotecaPageSource).toContain('leading-relaxed text-white');
    const bibliotecaHeroTitleIndex = bibliotecaPageSource.indexOf('font-display text-4xl font-bold leading-tight !text-white');
    const bibliotecaHeroTitleSource = bibliotecaPageSource.slice(bibliotecaHeroTitleIndex, bibliotecaHeroTitleIndex + 240);

    expect(bibliotecaHeroTitleIndex).toBeGreaterThan(-1);
    expect(bibliotecaHeroTitleSource).toContain('Recursos');
    expect(bibliotecaHeroTitleSource).not.toContain('layout.pages.biblioteca.title');
    expect(bibliotecaPageSource).toContain('layout.pages.biblioteca.description');
  });

  it('renders hero titles over the new black image overlay in white', () => {
    expect(ponDoJueusPageSource).toContain('heroTitleTone="green"');
    expect(bibliotecaJrsPageSource).toContain('heroTitleTone="green"');
    expect(institutionalProgrammePageSource).not.toContain("heroTitleTone === 'green'");
    expect(institutionalProgrammePageSource).toContain('absolute inset-0 z-0 bg-black/45');
    expect(institutionalProgrammePageSource).toContain('!text-white');
  });

  it('keeps the recently changed page section titles as plain green text', () => {
    [
      [oficinaDoBurelPageSource, 'Conteúdos da Oficina do Burel'],
      [artigosParaVendaPageSource, 'Amostra de artigos para venda'],
      [ponDoJueusPageSource, 'Conteúdos do PON do Jueus'],
      [escolaDosNossosAvosPageSource, 'Conteúdos da Escola dos Nossos Avós'],
      [sobreNosPageSource, 'about.whoWeAreTitle'],
      [sobreNosPageSource, 'about.originTitle'],
      [sobreNosPageSource, 'about.foundersTitle'],
      [sobreNosPageSource, 'layout.aboutPage.socialBodiesTitle'],
      [bibliotecaPageSource, 'Conteúdos de Recursos'],
    ].forEach(([source, title]) => {
      const titleIndex = source.indexOf(title);
      const titleOpeningTag = source.lastIndexOf('<h', titleIndex);
      const titleSource = source.slice(titleOpeningTag, titleIndex);

      expect(titleIndex).toBeGreaterThan(-1);
      expect(titleSource).toContain('!text-[#0f4c36]');
      expect(titleSource).not.toContain('text-foreground');
      expect(titleSource).not.toContain('bg-[#0f4c36]');
      expect(titleSource).not.toContain('rounded-');
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

  it('renders videos and PDFs from the recent page media contexts', () => {
    [
      [oficinaDoBurelPageSource, "listGalleryMedia('public', 'oficina-do-burel')"],
      [artigosParaVendaPageSource, "listGalleryMedia('public', 'artigos-para-venda')"],
      [ponDoJueusPageSource, "listGalleryMedia('public', 'pon-do-jueus')"],
      [escolaDosNossosAvosPageSource, "listGalleryMedia('public', 'escola-dos-nossos-avos')"],
      [bibliotecaJrsPageSource, "listGalleryMedia('public', 'biblioteca-jrs')"],
      [oficinasDeFormacaoPageSource, "listGalleryMedia('public', 'oficinas-de-formacao')"],
      [publicacoesPageSource, "listGalleryMedia('public', 'publicacoes')"],
      [bibliotecaPageSource, "listGalleryMedia('public', 'biblioteca')"],
    ].forEach(([source, context]) => {
      expect(source).toContain(context);
      expect(source).toContain('<GalleryTabs items={media} />');
    });
  });

  it('renders contact, gallery and Serra intros from appearance settings', () => {
    expect(contactosPageSource).toContain('const contactPage = layout.pages.contactos');
    expect(contactosPageSource).toContain('contactPage.title');
    expect(contactosPageSource).toContain('contactPage.description');
    expect(contactosPageSource).toContain('contactPage.institutionalTitle');
    expect(contactosPageSource).toContain('contactPage.presidentName');
    expect(galeriaPageSource).toContain('layout.pages.galeria.title');
    expect(galeriaPageSource).toContain('layout.pages.galeria.description');
    expect(serraPageSource).toContain('layout.pages.serra.description');
  });
});
