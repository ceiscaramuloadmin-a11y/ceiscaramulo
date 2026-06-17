/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const backofficePageSource = readFileSync(
  resolve(process.cwd(), 'app/backoffice/page.tsx'),
  'utf8'
);

describe('backoffice page guards', () => {
  it('uses a fixed collapsible sidebar for backoffice navigation', () => {
    expect(backofficePageSource).toContain('isSidebarCollapsed');
    expect(backofficePageSource).toContain('aria-label="Navegação do backoffice"');
    expect(backofficePageSource).toContain('fixed left-0 top-0');
    expect(backofficePageSource).toContain('h-screen');
    expect(backofficePageSource).toContain('BACKOFFICE_NAV_ITEMS');
    expect(backofficePageSource).toContain('Colapsar menu lateral');
    expect(backofficePageSource).toContain('Expandir menu lateral');
    expect(backofficePageSource).not.toContain('lg:hidden');
  });

  it('renames Layout CMS to Aparência in backoffice navigation', () => {
    expect(backofficePageSource).toContain("{ id: 'layout', label: 'Aparência' }");
    expect(backofficePageSource).toContain('>Aparência</h2>');
    expect(backofficePageSource).not.toContain('Layout CMS');
  });

  it('exposes a dedicated Sobre Nos backoffice editor backed by layout settings', () => {
    expect(backofficePageSource).toContain("{ id: 'about', label: 'Sobre Nós' }");
    expect(backofficePageSource).toContain("activeSection === 'about'");
    expect(backofficePageSource).toContain('Editar página Sobre Nós');
    expect(backofficePageSource).toContain('layoutSettings.aboutPage');
    expect(backofficePageSource).toContain('updateAboutPage');
    expect(backofficePageSource).toContain('updateAboutParagraphs');
    expect(backofficePageSource).toContain('updateAboutSocialBodies');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout'");
  });

  it('exposes a dedicated user profile page for account security', () => {
    expect(backofficePageSource).toContain("'overview' | 'profile'");
    expect(backofficePageSource).toContain("{ id: 'profile', label: 'Perfil' }");
    expect(backofficePageSource).toContain("const sections: SectionId[] = ['overview', 'profile']");
    expect(backofficePageSource).toContain("activeSection === 'profile'");
    expect(backofficePageSource).toContain('Perfil do utilizador');
    expect(backofficePageSource).toContain('Segurança da conta');
    expect(backofficePageSource).toContain('currentAdmin?.email');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<{ success: boolean }>('/api/admin/password'");
  });

  it('updates the overview dashboard with quick actions and profile access', () => {
    expect(backofficePageSource).toContain('Painel de visão geral');
    expect(backofficePageSource).toContain('Resumo do backoffice');
    expect(backofficePageSource).toContain('Ações rápidas');
    expect(backofficePageSource).toContain('Gerir perfil');
    expect(backofficePageSource).not.toContain('<Card title="Projetos" value={stats.projects}');
    expect(backofficePageSource).toContain('<Card title="Mensagens" value={stats.contacts}');
    expect(backofficePageSource).toContain("onClick={() => setActiveSection('profile')}");
    expect(backofficePageSource).toContain("!['overview', 'profile'].includes(item.id)");
    expect(backofficePageSource).toContain('lg:grid-cols-4');
  });

  it('exposes a dedicated messages section in the backoffice with read-state actions', () => {
    expect(backofficePageSource).toContain("{ id: 'contacts', label: 'Mensagens' }");
    expect(backofficePageSource).toContain('availableSections.includes(item.id)');
    expect(backofficePageSource).toContain('setActiveSection(item.id)');
    expect(backofficePageSource).toContain('mt-6 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1');
    expect(backofficePageSource).toContain('Mensagens de contacto');
    expect(backofficePageSource).toContain('Marcar como lida');
    expect(backofficePageSource).toContain('Marcar como não lida');
  });

  it('keeps the requested administrative menu order with messages and history last', () => {
    const navigationBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS'),
      backofficePageSource.indexOf('const APPEARANCE_TABS')
    );

    expect(backofficePageSource).not.toContain('function sortBackofficeNavItems');
    expect(backofficePageSource).toContain('BACKOFFICE_NAV_ITEMS.filter((item) => availableSections.includes(item.id))');
    expect(navigationBlock).toContain("{ id: 'contacts', label: 'Mensagens' }");
    expect(navigationBlock).not.toContain("{ id: 'contacts', label: 'Contactos' }");
    expect(navigationBlock.indexOf("{ id: 'contacts', label: 'Mensagens' }")).toBeLessThan(
      navigationBlock.indexOf("{ id: 'audit', label: 'Histórico' }")
    );
    expect(backofficePageSource).toContain("{ id: 'publications', label: 'Recursos' }");
  });

  it('shows the backoffice change history with the 15 day cleanup policy', () => {
    expect(backofficePageSource).toContain("{ id: 'audit', label: 'Histórico' }");
    expect(backofficePageSource).toContain('Histórico de alterações');
    expect(backofficePageSource).toContain('Os eventos com mais de 15 dias são apagados automaticamente');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<AuditLogEntry[]>('/api/admin/audit')");
  });

  it('allows PDF attachments in the resources form', () => {
    expect(backofficePageSource).toContain('label="Documento PDF"');
    expect(backofficePageSource).toContain('accept="application/pdf"');
    expect(backofficePageSource).toContain("fd.append('document', publicationForm.documentFile)");
  });

  it('keeps the news slug field hidden from the backoffice form flow', () => {
    expect(backofficePageSource).not.toContain('label="Slug"');
    expect(backofficePageSource).not.toContain('newsForm.slug');
    expect(backofficePageSource).not.toContain("fd.append('slug'");
  });

  it('does not expose a manual hero image URL field in layout management', () => {
    expect(backofficePageSource).not.toContain('Hero · Imagem URL');
    expect(backofficePageSource).toContain('Hero · Upload de imagem');
  });

  it('does not expose the homepage hero description field in appearance management', () => {
    expect(backofficePageSource).not.toContain('Hero · Descrição');
    expect(backofficePageSource).toContain('Hero · Subtítulo');
  });

  it('does not expose the homepage hero preview in appearance management', () => {
    expect(backofficePageSource).not.toContain('Pré-visualização');
    expect(backofficePageSource).not.toContain('pré-visualização do primeiro ecrã');
    expect(backofficePageSource).toContain('Gere o título, botões e imagem do primeiro ecrã.');
  });

  it('allows the appearance tab to edit footer contact details', () => {
    expect(backofficePageSource).toContain('Footer · Contactos');
    expect(backofficePageSource).toContain('Footer · Morada');
    expect(backofficePageSource).toContain('Footer · Telefone');
    expect(backofficePageSource).toContain('Footer · Email');
    expect(backofficePageSource).toContain('Footer · Redes sociais');
    expect(backofficePageSource).toContain('Título da secção');
    expect(backofficePageSource).toContain('Instagram');
    expect(backofficePageSource).toContain('updateFooterContact');
    expect(backofficePageSource).toContain('updateFooterSocialMedia');
  });

  it('aligns the footer appearance editor with the public footer structure', () => {
    expect(backofficePageSource).toContain('Footer · Navegação visível');
    expect(backofficePageSource).toContain('A coluna Conhecer é fixa no frontend');
    expect(backofficePageSource).toContain('Atividades · /atividades');
    expect(backofficePageSource).toContain('Notícias · /noticias');
    expect(backofficePageSource).toContain('Footer · Tornar-se sócio');
    expect(backofficePageSource).toContain('layoutSettings.footer.membership.title');
    expect(backofficePageSource).toContain('layoutSettings.footer.membership.description');
    expect(backofficePageSource).toContain('layoutSettings.footer.membership.ctaLabel');
    expect(backofficePageSource).toContain('layoutSettings.footer.membership.ctaHref');
    expect(backofficePageSource).toContain('Footer · Rodapé legal');
    expect(backofficePageSource).toContain("!column.title.toLowerCase().includes('restrita')");
    expect(backofficePageSource).toContain("!link.href.startsWith('/backoffice')");
    expect(backofficePageSource).not.toContain('Footer · Descrição da marca');
  });

  it('organizes appearance management into CMS-like tabs with publishing only', () => {
    const appearanceTabsBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const APPEARANCE_TABS'),
      backofficePageSource.indexOf('const APPEARANCE_PAGE_FIELDS')
    );
    const appearanceHeaderBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('role="tablist" aria-label="Separadores da aparência"'),
      backofficePageSource.indexOf("appearanceTab === 'hero'")
    );

    expect(backofficePageSource).toContain('APPEARANCE_TABS');
    expect(appearanceTabsBlock).toContain("'hero'");
    expect(appearanceTabsBlock).toContain("'pages'");
    expect(appearanceTabsBlock).toContain("'footer'");
    expect(appearanceTabsBlock).not.toContain("'icons'");
    expect(appearanceTabsBlock).not.toContain("'colors'");
    expect(appearanceTabsBlock).not.toContain('Ícones');
    expect(appearanceTabsBlock).not.toContain('Cores');
    expect(appearanceTabsBlock).not.toContain("'logos'");
    expect(appearanceTabsBlock).not.toContain('Logótipos');
    expect(appearanceTabsBlock).toContain("'seo'");
    expect(backofficePageSource).not.toContain('Guardar rascunho');
    expect(backofficePageSource).not.toContain('Carregar rascunho');
    expect(backofficePageSource).toContain('Publicar Alterações');
    expect(appearanceHeaderBlock).not.toContain('Publicar Alterações');
    expect(backofficePageSource).toContain('updateSeo');
  });

  it('adds all public frontend pages to the appearance page editor', () => {
    const pagesEditorBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("appearanceTab === 'pages'"),
      backofficePageSource.indexOf("appearanceTab === 'footer'")
    );

    expect(backofficePageSource).toContain('APPEARANCE_PAGE_FIELDS');
    expect(backofficePageSource).toContain("'bibliotecaJrs'");
    expect(backofficePageSource).toContain("'contactos'");
    expect(backofficePageSource).toContain("'escolaDosNossosAvos'");
    expect(backofficePageSource).toContain("'galeria'");
    expect(backofficePageSource).toContain("'oficinaDoBurel'");
    expect(backofficePageSource).toContain("'oficinasDeFormacao'");
    expect(backofficePageSource).toContain("'ponDoJueus'");
    expect(backofficePageSource).toContain("'publicacoes'");
    expect(backofficePageSource).toContain("{ id: 'biblioteca', label: 'Recursos'");
    expect(backofficePageSource).toContain("{ id: 'bibliotecaJrs', label: 'Biblioteca JRS' }");
    expect(backofficePageSource).toContain("{ id: 'escolaDosNossosAvos', label: 'Escola dos Nossos Avós' }");
    expect(backofficePageSource).toContain("{ id: 'oficinaDoBurel', label: 'Oficina do Burel' }");
    expect(backofficePageSource).toContain("{ id: 'oficinasDeFormacao', label: 'Oficinas de formação' }");
    expect(backofficePageSource).toContain("{ id: 'ponDoJueus', label: 'PON do Jueus' }");
    expect(backofficePageSource).toContain("{ id: 'publicacoes', label: 'Publicações' }");
    expect(backofficePageSource).toContain('updateAppearancePage');
    expect(backofficePageSource).toContain('Mensagem sem conteúdos');
    expect(pagesEditorBlock).toContain('max-h-[70vh] gap-3 overflow-y-auto pr-2 md:grid-cols-2');
  });

  it('removes only the global gallery entry from the backoffice navigation and overview', () => {
    const navigationBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS'),
      backofficePageSource.indexOf('const APPEARANCE_TABS')
    );

    expect(navigationBlock).not.toContain("id: 'gallery'");
    expect(navigationBlock).toContain("id: 'gallery-oficina-do-burel'");
    expect(navigationBlock).toContain("id: 'gallery-biblioteca-jrs'");
    expect(navigationBlock).toContain("id: 'gallery-pon-do-jueus'");
    expect(navigationBlock).toContain("id: 'gallery-escola-dos-nossos-avos'");
    expect(navigationBlock).toContain("id: 'gallery-oficinas-de-formacao'");
    expect(navigationBlock).toContain("id: 'gallery-publicacoes'");
    expect(backofficePageSource).not.toContain('<Card title="Galeria"');
  });

  it('keeps only one Recursos entry in the backoffice navigation', () => {
    const navigationBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS'),
      backofficePageSource.indexOf('const APPEARANCE_TABS')
    );

    expect(navigationBlock).toContain("{ id: 'publications', label: 'Recursos' }");
    expect(navigationBlock).not.toContain("id: 'gallery-biblioteca'");
    expect((navigationBlock.match(/label: 'Recursos'/g) || [])).toHaveLength(1);
  });

  it('allows the recent page media sections to submit videos and PDFs', () => {
    expect(backofficePageSource).toContain("context: 'oficina-do-burel'");
    expect(backofficePageSource).toContain("context: 'pon-do-jueus'");
    expect(backofficePageSource).toContain("context: 'escola-dos-nossos-avos'");
    expect(backofficePageSource).toContain("context: 'biblioteca-jrs'");
    expect(backofficePageSource).toContain("context: 'oficinas-de-formacao'");
    expect(backofficePageSource).toContain("context: 'publicacoes'");
    expect(backofficePageSource).toContain("context: 'biblioteca'");
    expect(backofficePageSource).toContain('<option value="video">Vídeos</option>');
    expect(backofficePageSource).toContain('<option value="document">Documentos/PDFs</option>');
    expect(backofficePageSource).toContain('<option value="video">Vídeo</option>');
    expect(backofficePageSource).toContain('<option value="document">Documento/PDF</option>');
    expect(backofficePageSource).toContain("if (type === 'video') return 'video/*'");
    expect(backofficePageSource).toContain("application/pdf,.pdf");
    expect(backofficePageSource).toContain("fd.append('context', activeGalleryConfig?.context || 'global')");
    expect(backofficePageSource).toContain("fd.append('sourceFile', item.file)");
  });

  it('uploads rich text media before saving news content so audio is not persisted inline', () => {
    expect(backofficePageSource).toContain('uploadRichTextMedia');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<{ url: string }>('/api/content-assets/rich-text'");
    expect(backofficePageSource).toContain("onUploadMedia={(file, kind) => uploadRichTextMedia('news', file, kind)}");
  });

  it('boots the backoffice with the lightweight stats endpoint instead of loading every module', () => {
    expect(backofficePageSource).toContain("fetchAdminEndpoint<DashboardStats>('/api/admin/stats')");
    expect(backofficePageSource).toContain('await refreshDashboardStats();');
    expect(backofficePageSource).not.toContain('await Promise.allSettled([refreshAll(), refreshGovernance(), refreshLayout(), refreshGallery(), refreshContactMessages()])');
    expect(backofficePageSource).toContain('sections.push(...(Object.keys(PROGRAMME_GALLERY_SECTIONS) as ProgrammeGallerySectionId[]))');
  });
});
