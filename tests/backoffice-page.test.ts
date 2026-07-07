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
    const aboutEditorBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("{activeSection === 'about'"),
      backofficePageSource.indexOf("{activeSection === 'layout'", backofficePageSource.indexOf("{activeSection === 'about'"))
    );

    expect(backofficePageSource).toContain("{ id: 'about', label: 'Sobre Nós' }");
    expect(backofficePageSource).toContain("activeSection === 'about'");
    expect(backofficePageSource).toContain('Editar página Sobre Nós');
    expect(backofficePageSource).toContain('layoutSettings.aboutPage');
    expect(backofficePageSource).toContain('updateAboutPage');
    expect(backofficePageSource).toContain('updateAboutParagraphs');
    expect(backofficePageSource).toContain('updateAboutSocialBodies');
    expect(backofficePageSource).toContain('CTA contacto · Label da morada');
    expect(backofficePageSource).toContain('layoutSettings.aboutPage.contactAddress');
    expect(backofficePageSource).toContain('CTA contacto · Telefone');
    expect(backofficePageSource).toContain('layoutSettings.aboutPage.contactPhone');
    expect(backofficePageSource).toContain('CTA contacto · Email');
    expect(backofficePageSource).toContain('layoutSettings.aboutPage.contactEmail');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout'");
    expect(aboutEditorBlock).toContain('border border-[#cfe7bd] bg-[#f2faed] p-5');
    expect(aboutEditorBlock).toContain('className={`grid gap-3 md:grid-cols-2 ${APPEARANCE_PANEL_CLASS}`}');
    expect(aboutEditorBlock).toContain('className={`grid gap-3 ${APPEARANCE_PANEL_CLASS}`}');
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

  it('updates the overview dashboard without quick actions and keeps profile access', () => {
    const overviewBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'overview'"),
      backofficePageSource.indexOf("activeSection === 'profile'"),
    );

    expect(backofficePageSource).toContain('Painel de visão geral');
    expect(backofficePageSource).toContain('Resumo do backoffice');
    expect(backofficePageSource).not.toContain('Acompanha os conteúdos principais, consulta mensagens recentes e entra rapidamente nas áreas disponíveis.');
    expect(backofficePageSource).not.toContain('Ações rápidas');
    expect(backofficePageSource).not.toContain('Abre diretamente as áreas que podes gerir nesta sessão.');
    expect(backofficePageSource).not.toContain('const OVERVIEW_PUBLIC_PAGES');
    expect(overviewBlock).not.toContain('Páginas do site');
    expect(overviewBlock).toContain('overviewProgrammeCards.map');
    expect(backofficePageSource).toContain('galleryByContext?: Record<string, number>');
    expect(backofficePageSource).toContain("value: dashboardStats?.galleryByContext?.[section.context] ?? 0");
    expect(backofficePageSource).toContain(".filter((section) => section.context !== 'biblioteca')");
    expect(backofficePageSource).toContain("label: 'Artigos para venda'");
    expect(backofficePageSource).toContain("label: 'Biblioteca JRS'");
    expect(backofficePageSource).toContain("label: 'PON do Jueus'");
    expect(backofficePageSource).toContain("label: 'Escola dos Nossos Avós'");
    expect(backofficePageSource).toContain("label: 'Oficinas de formação'");
    expect(backofficePageSource).toContain("label: 'Publicações'");
    expect(overviewBlock).not.toContain("target=\"_blank\"");
    expect(overviewBlock).not.toContain('Ver perfil');
    expect(overviewBlock).not.toContain('Gerir perfil');
    expect(overviewBlock).not.toContain('<h2 className="text-xl font-semibold text-[#0f4c36]">Conta</h2>');
    expect(backofficePageSource).not.toContain('<Card title="Projetos" value={stats.projects}');
    expect(backofficePageSource).toContain('<Card title="Mensagens" value={stats.contacts}');
    expect((overviewBlock.match(/title=\"Recursos\"/g) || [])).toHaveLength(1);
    expect(overviewBlock).not.toContain("onClick={() => setActiveSection('profile')}");
    expect(overviewBlock).not.toContain("!['overview', 'profile'].includes(item.id)");
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
    expect(backofficePageSource).toContain("{ id: 'gallery-biblioteca', label: 'Recursos' }");
    expect(backofficePageSource).not.toContain("{ id: 'publications', label: 'Lista de recursos' }");
  });

  it('removes projects from the backoffice navigation, permissions and editors', () => {
    const navigationBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS'),
      backofficePageSource.indexOf('const APPEARANCE_TABS')
    );
    const permissionOptionsBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const ADMIN_PERMISSION_OPTIONS'),
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS')
    );
    const appearancePagesBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const APPEARANCE_PAGE_FIELDS'),
      backofficePageSource.indexOf('const PROGRAMME_GALLERY_SECTIONS')
    );

    expect(navigationBlock).not.toContain("id: 'projects'");
    expect(permissionOptionsBlock).not.toContain("id: 'projects'");
    expect(appearancePagesBlock).not.toContain("id: 'projetos'");
    expect(backofficePageSource).not.toContain("activeSection === 'projects'");
    expect(backofficePageSource).not.toContain('handleProjectSubmit');
    expect(backofficePageSource).not.toContain('projectForm');
  });

  it('shows a clear publications permission for admin access editing', () => {
    const permissionOptionsBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const ADMIN_PERMISSION_OPTIONS'),
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS')
    );
    const navigationBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS'),
      backofficePageSource.indexOf('const APPEARANCE_TABS')
    );

    expect(permissionOptionsBlock).toContain("{ id: 'publications', label: 'Publicações' }");
    expect(navigationBlock).not.toContain("{ id: 'publications', label: 'Lista de recursos' }");
    expect(navigationBlock).toContain("{ id: 'gallery-biblioteca', label: 'Recursos' }");
  });

  it('shows the backoffice change history with the 10 day cleanup policy', () => {
    const availableSectionsBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("const sections: SectionId[] = ['overview', 'profile']"),
      backofficePageSource.indexOf('const authHeaders')
    );

    expect(backofficePageSource).toContain("{ id: 'audit', label: 'Histórico' }");
    expect(backofficePageSource).toContain('Histórico de alterações');
    expect(backofficePageSource).toContain('Os eventos com mais de 10 dias são apagados automaticamente');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<AuditLogEntry[]>(`/api/admin/audit?limit=${ADMIN_AUDIT_LIMIT}`)");
    expect(availableSectionsBlock).toContain("sections.push('audit')");
    expect(availableSectionsBlock).not.toContain("permissionSet.has('audit')) sections.push('audit')");
  });

  it('removes the non-functional role toggle from admin management', () => {
    expect(backofficePageSource).toContain("activeSection === 'admins'");
    expect(backofficePageSource).not.toContain('Alternar papel');
    expect(backofficePageSource).not.toContain("role: admin.role === 'owner' ? 'editor' : 'owner'");
    expect(backofficePageSource).toContain('Permissões');
    expect(backofficePageSource).toContain("{admin.active ? 'Desativar' : 'Ativar'}");
  });

  it('allows optimized PDF, photo, video and audio attachments in the resources form', () => {
    expect(backofficePageSource).toContain('const RESOURCE_ATTACHMENT_ACCEPT');
    expect(backofficePageSource).toContain('video/*');
    expect(backofficePageSource).toContain('audio/*');
    expect(backofficePageSource).toContain('label="Ficheiro do recurso (PDF, foto, vídeo ou áudio)"');
    expect(backofficePageSource).toContain('accept={RESOURCE_ATTACHMENT_ACCEPT}');
    expect(backofficePageSource).toContain("fd.append('document', publicationForm.documentFile)");
  });

  it('keeps the resources form focused on single optimized resource uploads', () => {
    const resourcesBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'publications' || activeSection === 'gallery-biblioteca'"),
      backofficePageSource.indexOf("activeSection === 'contacts' ? (")
    );

    expect(backofficePageSource).toContain('function previewKindForResourceFile(file: File)');
    expect(resourcesBlock).toContain('Ficheiro do recurso (PDF, foto, vídeo ou áudio)');
    expect(resourcesBlock).toContain('accept={RESOURCE_ATTACHMENT_ACCEPT}');
    expect(resourcesBlock).not.toContain('Carregamento em massa');
    expect(resourcesBlock).not.toContain('Ficheiros do lote');
    expect(resourcesBlock).not.toContain('Carregar lote de recursos');
    expect(backofficePageSource).not.toContain('type PublicationBatchItem');
    expect(backofficePageSource).not.toContain('const [publicationBatchItems, setPublicationBatchItems]');
    expect(backofficePageSource).not.toContain('function handlePublicationBatchFiles(files: FileList | null)');
    expect(backofficePageSource).not.toContain('async function savePublicationBatch(event: FormEvent<HTMLFormElement>)');
    expect(backofficePageSource).not.toContain("label: 'A carregar lote de recursos'");
  });
  it('keeps the resources editor practical for managing the public library', () => {
    const resourcesBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'publications' || activeSection === 'gallery-biblioteca'"),
      backofficePageSource.indexOf("activeSection === 'contacts' ? (")
    );

    expect(resourcesBlock).toContain('description="Biblioteca simples: adiciona título, autor, ano, tipo e ficheiro otimizado (PDF, foto, vídeo ou áudio) ou link quando existir."');
    expect(resourcesBlock).toContain('newButtonLabel="Novo recurso"');
    expect(resourcesBlock).toContain('label="Autor ou entidade"');
    expect(resourcesBlock).toContain('Tipo de recurso');
    expect(resourcesBlock).toContain('label="Resumo simples"');
    expect(resourcesBlock).toContain('label="Link externo do recurso (opcional)"');
    expect(resourcesBlock).toContain('label="Capa (opcional)"');
  });

  it('also shows the legacy resource catalogue form inside the Recursos media page', () => {
    const resourcesBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'publications' || activeSection === 'gallery-biblioteca'"),
      backofficePageSource.indexOf("activeSection === 'contacts' ? (")
    );

    expect(backofficePageSource).toContain("if (activeSection === 'gallery-biblioteca')");
    expect(backofficePageSource).toContain("void refreshContentSection('publications')");
    expect(resourcesBlock).toContain('title="Recursos"');
    expect(resourcesBlock).not.toContain('Lista de recursos');
    expect(resourcesBlock).toContain('label="Autor ou entidade"');
    expect(resourcesBlock).toContain('label="Ano"');
    expect(resourcesBlock).toContain('Tipo de recurso');
    expect(resourcesBlock).toContain('Selecionar tipo');
    expect(backofficePageSource).toContain("{ value: 'documento', label: 'Documento' }");
    expect(backofficePageSource).toContain("{ value: 'livro', label: 'Livro' }");
    expect(backofficePageSource).toContain("{ value: 'artigo', label: 'Artigo' }");
    expect(backofficePageSource).toContain("{ value: 'relatorio', label: 'Relat");
    expect(backofficePageSource).toContain("{ value: 'tese', label: 'Tese' }");
  });

  it('keeps resources always public and clears the resources form when creating a new item', () => {
    const resourcesBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'publications' || activeSection === 'gallery-biblioteca'"),
      backofficePageSource.indexOf("activeSection === 'contacts' ? (")
    );

    expect(backofficePageSource).toContain('function getEmptyPublicationForm()');
    expect(backofficePageSource).toContain("year: ''");
    expect(backofficePageSource).toContain("type: ''");
    expect(backofficePageSource).toContain('setPublicationForm(getEmptyPublicationForm())');
    expect(backofficePageSource).not.toContain('clearPublicationBatchItems()');
    expect(resourcesBlock).toContain('onNew={resetPublicationForm}');
    expect(resourcesBlock).toContain('key={`publication-document-${publicationFormResetKey}`}');
    expect(resourcesBlock).toContain('key={`publication-cover-${publicationFormResetKey}`}');
    expect(resourcesBlock).not.toContain('Check label="Publicado"');
    expect(backofficePageSource).toContain("fd.append('published', 'true')");
    expect(backofficePageSource).not.toContain("fd.append('published', String(publicationForm.published))");
  });

  it('limits resource types to values accepted by the database', () => {
    const resourcesBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'publications' || activeSection === 'gallery-biblioteca'"),
      backofficePageSource.indexOf("activeSection === 'contacts' ? (")
    );

    expect(backofficePageSource).toContain('const PUBLICATION_TYPE_OPTIONS');
    expect(backofficePageSource).toContain("{ value: 'documento', label: 'Documento' }");
    expect(backofficePageSource).toContain("{ value: 'livro', label: 'Livro' }");
    expect(backofficePageSource).toContain("{ value: 'artigo', label: 'Artigo' }");
    expect(backofficePageSource).toContain("{ value: 'relatorio', label: 'Relatório' }");
    expect(backofficePageSource).toContain("{ value: 'tese', label: 'Tese' }");
    expect(resourcesBlock).toContain('PUBLICATION_TYPE_OPTIONS.map');
    expect(resourcesBlock).toContain('Selecionar tipo');
    expect(resourcesBlock).not.toContain('<Input label="Tipo"');
  });

  it('shows a specific message when resource uploads are too large', () => {
    expect(backofficePageSource).toContain('const responseText = await response.text()');
    expect(backofficePageSource).toContain('response.status === 413');
    expect(backofficePageSource).toContain('O ficheiro é demasiado grande para ser enviado de uma vez');
  });

  it('uses browser-safe image formats for public cover upload pickers', () => {
    expect(backofficePageSource).toContain("const WEB_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'");
    expect(backofficePageSource).toContain("if (type === 'photo') return WEB_IMAGE_ACCEPT");
    expect(backofficePageSource).toContain('accept = WEB_IMAGE_ACCEPT');
  });

  it('keeps the news slug field hidden from the backoffice form flow', () => {
    expect(backofficePageSource).not.toContain('label="Slug"');
    expect(backofficePageSource).not.toContain('newsForm.slug');
    expect(backofficePageSource).not.toContain("fd.append('slug'");
  });

  it('allows removing cover photos from news and activities without restoring publish toggles', () => {
    const newsBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'news' ? ("),
      backofficePageSource.indexOf("activeSection === 'activities' ? (")
    );
    const activitiesBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'activities' ? ("),
      backofficePageSource.indexOf("activeSection === 'publications' || activeSection === 'gallery-biblioteca'")
    );

    expect(newsBlock).toContain('Check label="Remover foto de capa atual"');
    expect(newsBlock).toContain('checked={newsForm.removeImage}');
    expect(newsBlock).toContain('removeImage: checked, imageFile: checked ? null : c.imageFile');
    expect(newsBlock).not.toContain('Check label="Publicado"');
    expect(activitiesBlock).toContain('Check label="Remover foto de capa atual"');
    expect(activitiesBlock).toContain('checked={activityForm.removeImage}');
    expect(activitiesBlock).toContain('removeImage: checked, imageFile: checked ? null : c.imageFile');
    expect(activitiesBlock).toContain('Categoria da atividade');
    expect(activitiesBlock).toContain('value={activityForm.category}');
    expect(activitiesBlock).toContain('ACTIVITY_CATEGORY_OPTIONS.map');
    expect(backofficePageSource).toContain("fd.append('category', activityForm.category)");
    expect(backofficePageSource).toContain("category: v.category || 'evento'");
    expect(activitiesBlock).not.toContain('Check label="Publicado"');
    expect(backofficePageSource).toContain("fd.append('published', 'true')");
    expect(backofficePageSource).toContain("fd.append('removeImage', String(newsForm.removeImage))");
    expect(backofficePageSource).toContain("fd.append('removeImage', String(activityForm.removeImage))");
    expect(backofficePageSource).not.toContain("fd.append('removeImage', 'false')");
  });

  it('scrolls to the content form when creating a new section item', () => {
    const sectionLayoutBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('function SectionLayout'),
      backofficePageSource.indexOf('function GalleryGroup')
    );

    expect(sectionLayoutBlock).toContain('function handleNewClick()');
    expect(sectionLayoutBlock).toContain('onNew();');
    expect(sectionLayoutBlock).toContain("formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(sectionLayoutBlock).toContain('onClick={handleNewClick}');
  });

  it('does not expose homepage hero image controls in appearance management', () => {
    const appearanceTabsBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const APPEARANCE_TABS'),
      backofficePageSource.indexOf('const APPEARANCE_PAGE_FIELDS')
    );
    const appearanceEditorBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'layout'"),
      backofficePageSource.indexOf('function TextArea')
    );

    expect(appearanceTabsBlock).not.toContain("'hero'");
    expect(appearanceTabsBlock).not.toContain("label: 'Hero'");
    expect(appearanceEditorBlock).not.toContain('Hero da Página Inicial');
    expect(appearanceEditorBlock).not.toContain('Hero · Upload de imagem');
    expect(appearanceEditorBlock).not.toContain('setHeroImageFile');
    expect(appearanceEditorBlock).not.toContain("fd.append('heroImage'");
    expect(backofficePageSource).not.toContain('Hero · Imagem URL');
  });

  it('does not expose the hidden homepage hero CTA fields in appearance management', () => {
    expect(backofficePageSource).not.toContain('CTA principal · Label');
    expect(backofficePageSource).not.toContain('CTA principal · Link');
    expect(backofficePageSource).not.toContain('CTA secundário · Label');
    expect(backofficePageSource).not.toContain('CTA secundário · Link');
  });

  it('does not expose the homepage hero description field in appearance management', () => {
    expect(backofficePageSource).not.toContain('Hero · Descrição');
    expect(backofficePageSource).toContain('Hero · Subtítulo');
  });

  it('does not expose the homepage hero preview in appearance management', () => {
    expect(backofficePageSource).not.toContain('Pré-visualização');
    expect(backofficePageSource).not.toContain('pré-visualização do primeiro ecrã');
    expect(backofficePageSource).not.toContain('Gere o título, botões e imagem do primeiro ecrã.');
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
    expect(backofficePageSource).toContain('A coluna CEISCaramulo em ação é fixa no frontend');
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
      backofficePageSource.indexOf("appearanceTab === 'pages'")
    );

    expect(backofficePageSource).toContain('APPEARANCE_TABS');
    expect(appearanceTabsBlock).not.toContain("'hero'");
    expect(backofficePageSource).toContain("useState<AppearanceTab>('pages')");
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

  it('uses a light green highlight on large appearance panels for readability', () => {
    const appearanceEditorBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("activeSection === 'layout'"),
      backofficePageSource.indexOf('function TextArea')
    );

    expect(backofficePageSource).toContain("const APPEARANCE_PANEL_CLASS = 'rounded-lg border border-[#cfe7bd] bg-[#f2faed] p-3'");
    expect(appearanceEditorBlock).toContain('border border-[#cfe7bd] bg-[#f2faed] p-5');
    expect(appearanceEditorBlock).toContain('bg-[#f8fcf4]/95');
    expect(appearanceEditorBlock).toContain('className={`grid gap-3 ${APPEARANCE_PANEL_CLASS}`}');
    expect(appearanceEditorBlock).toContain('className={APPEARANCE_PANEL_CLASS}');
  });

  it('adds the active public frontend pages to the appearance page editor', () => {
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
    expect(backofficePageSource).toContain("'artigosParaVenda'");
    expect(backofficePageSource).toContain("'oficinasDeFormacao'");
    expect(backofficePageSource).toContain("'ponDoJueus'");
    expect(backofficePageSource).toContain("'publicacoes'");
    expect(backofficePageSource).toContain("{ id: 'biblioteca', label: 'Recursos'");
    expect(backofficePageSource).toContain("{ id: 'bibliotecaJrs', label: 'Biblioteca JRS' }");
    expect(backofficePageSource).toContain("{ id: 'escolaDosNossosAvos', label: 'Escola dos Nossos Avós' }");
    expect(backofficePageSource).toContain("{ id: 'oficinaDoBurel', label: 'Oficina do Burel' }");
    expect(backofficePageSource).toContain("{ id: 'artigosParaVenda', label: 'Artigos para venda' }");
    expect(backofficePageSource).toContain("{ id: 'oficinasDeFormacao', label: 'Oficinas de formação' }");
    expect(backofficePageSource).toContain("{ id: 'ponDoJueus', label: 'PON do Jueus' }");
    expect(backofficePageSource).toContain("{ id: 'publicacoes', label: 'Publicações' }");
    expect(backofficePageSource).not.toContain("{ id: 'serra', label: 'Serra do Caramulo' }");
    expect(backofficePageSource).toContain('updateAppearancePage');
    expect(backofficePageSource).toContain('Mensagem sem conteúdos');
    expect(pagesEditorBlock).toContain("page.id === 'contactos'");
    expect(pagesEditorBlock).toContain('Página Contactos · Título das informações');
    expect(pagesEditorBlock).toContain('Página Contactos · Nome do presidente');
    expect(pagesEditorBlock).toContain('Página Contactos · Telefone');
    expect(pagesEditorBlock).toContain('Página Contactos · Email');
    expect(pagesEditorBlock).toContain("updateAppearancePage('contactos', { presidentName: value })");
    expect(pagesEditorBlock).toContain('max-h-[70vh] gap-3 overflow-y-auto pr-2 md:grid-cols-2');
  });

  it('removes only the global gallery entry from the backoffice navigation and overview', () => {
    const navigationBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS'),
      backofficePageSource.indexOf('const APPEARANCE_TABS')
    );

    expect(navigationBlock).not.toContain("id: 'gallery'");
    expect(navigationBlock).toContain("id: 'gallery-oficina-do-burel'");
    expect(navigationBlock).toContain("id: 'gallery-artigos-para-venda'");
    expect(navigationBlock).toContain("id: 'gallery-biblioteca-jrs'");
    expect(navigationBlock).toContain("id: 'gallery-biblioteca'");
    expect(navigationBlock).toContain("id: 'gallery-pon-do-jueus'");
    expect(navigationBlock).toContain("id: 'gallery-escola-dos-nossos-avos'");
    expect(navigationBlock).toContain("id: 'gallery-oficinas-de-formacao'");
    expect(navigationBlock).toContain("id: 'gallery-publicacoes'");
    expect(backofficePageSource).not.toContain('<Card title="Galeria"');
  });

  it('keeps only the Recursos entry in the backoffice navigation', () => {
    const navigationBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const BACKOFFICE_NAV_ITEMS'),
      backofficePageSource.indexOf('const APPEARANCE_TABS')
    );

    expect(navigationBlock).toContain("{ id: 'gallery-biblioteca', label: 'Recursos' }");
    expect(navigationBlock).not.toContain("{ id: 'publications', label: 'Lista de recursos' }");
    expect((navigationBlock.match(/label: 'Recursos'/g) || [])).toHaveLength(1);
  });

  it('allows the recent page media sections to submit videos and PDFs', () => {
    const saveGalleryBatchBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('async function saveGalleryBatch'),
      backofficePageSource.indexOf('async function createAdminUser')
    );

    expect(backofficePageSource).toContain("context: 'oficina-do-burel'");
    expect(backofficePageSource).toContain("context: 'pon-do-jueus'");
    expect(backofficePageSource).toContain("context: 'escola-dos-nossos-avos'");
    expect(backofficePageSource).toContain("context: 'biblioteca-jrs'");
    expect(backofficePageSource).toContain("context: 'oficinas-de-formacao'");
    expect(backofficePageSource).toContain("context: 'publicacoes'");
    expect(backofficePageSource).toContain("context: 'biblioteca'");
    expect(backofficePageSource).toContain('const GALLERY_BATCH_ACCEPT');
    expect(backofficePageSource).toContain('galleryAcceptForTypes(ALL_GALLERY_MEDIA_TYPES)');
    expect(backofficePageSource).toContain('galleryAllowedTypes.map((type) => (');
    expect(backofficePageSource).toContain('function inferGalleryBatchType');
    expect(backofficePageSource).toContain("import { upload } from '@vercel/blob/client'");
    expect(backofficePageSource).toContain('const uploadGalleryFileToBlob = useCallback');
    expect(backofficePageSource).toContain("handleUploadUrl: '/api/gallery/client-upload'");
    expect(backofficePageSource).toContain("access: 'private'");
    expect(backofficePageSource).toContain('multipart: shouldUseClientMultipartUpload(file)');
    expect(backofficePageSource).toContain('return `/uploads/backoffice/${relativePath}`');
    expect(backofficePageSource).toContain('O tipo é detetado automaticamente.');
    expect(backofficePageSource).toContain("if (type === 'video') return 'video/*'");
    expect(backofficePageSource).toContain("application/pdf,.pdf");
    expect(backofficePageSource).toContain("fd.append('context', activeGalleryConfig?.context || 'global')");
    expect(saveGalleryBatchBlock).toContain("fd.append('type', item.type)");
    expect(saveGalleryBatchBlock).toContain('const sourceUrl = await uploadGalleryFileToBlob(item.file, galleryContext');
    expect(saveGalleryBatchBlock).toContain("fd.append('sourceUrl', sourceUrl)");
    expect(saveGalleryBatchBlock).toContain("fd.append('mimeType', item.file.type || '')");
    expect(saveGalleryBatchBlock).not.toContain("fd.append('sourceFile', item.file)");
    expect(backofficePageSource).toContain('async function runGalleryBatchQueue');
    expect(backofficePageSource).toContain('Math.min(concurrency, queue.length)');
    expect(saveGalleryBatchBlock).toContain('await runGalleryBatchQueue(galleryBatchItems, uploadOne, 1)');
    expect(saveGalleryBatchBlock).not.toContain("fd.append('type', galleryBatchType)");
    expect(backofficePageSource).toContain('accept={galleryBatchAccept}');
    expect(backofficePageSource).not.toContain('accept={galleryAcceptForType(galleryBatchType)}');
    expect(backofficePageSource).not.toContain('MAX_INLINE_AUDIO_UPLOAD_BYTES');
  });

  it('allows Artigos para venda uploads to use all supported media types', () => {
    const programmeGalleryConfigStart = backofficePageSource.indexOf('const PROGRAMME_GALLERY_SECTIONS');
    const salesGalleryBlock = backofficePageSource.slice(
      backofficePageSource.indexOf("'gallery-artigos-para-venda'", programmeGalleryConfigStart),
      backofficePageSource.indexOf("'gallery-biblioteca-jrs'", programmeGalleryConfigStart)
    );

    expect(backofficePageSource).not.toContain('const SALES_GALLERY_MEDIA_TYPES');
    expect(salesGalleryBlock).not.toContain('allowedTypes:');
    expect(salesGalleryBlock).toContain('Fotografias, vídeos, áudios e documentos associados');
    expect(backofficePageSource).toContain('inferGalleryBatchType(file, galleryBatchType, galleryAllowedTypes)');
    expect(backofficePageSource).toContain('accept={galleryBatchAccept}');
  });

  it('shows upload progress feedback for slow backoffice uploads', () => {
    const progressBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('type UploadProgress'),
      backofficePageSource.indexOf('function isProgrammeGallerySection')
    );

    expect(progressBlock).toContain('function requestJsonWithUploadProgress');
    expect(progressBlock).toContain('request.upload.onprogress');
    expect(backofficePageSource).toContain('const [operationProgress, setOperationProgress]');
    expect(backofficePageSource).toContain('OperationProgressNotice');
    expect(backofficePageSource).toContain('role="status"');
    expect(backofficePageSource).toContain('aria-live="polite"');
    expect(backofficePageSource).toContain('A carregar lote da galeria');
    expect(backofficePageSource).toContain('tabular-nums');
  });

  it('adds lightweight management screens for public comments and newsletter subscribers', () => {
    expect(backofficePageSource).toContain("{ id: 'comments', label: 'Comentários' }");
    expect(backofficePageSource).toContain("{ id: 'newsletter', label: 'Newsletter' }");
    expect(backofficePageSource).toContain("fetchAdminEndpoint<ContentComment[]>(`/api/admin/comments?limit=${ADMIN_COMMENTS_LIMIT}`)");
    expect(backofficePageSource).toContain("fetchAdminEndpoint<NewsletterSubscriber[]>(`/api/admin/newsletter?limit=${ADMIN_NEWSLETTER_LIMIT}`)");
    expect(backofficePageSource).toContain('async function deleteContentComment');
    expect(backofficePageSource).toContain('async function exportNewsletterSubscribers');
    expect(backofficePageSource).toContain('Exportar CSV');
  });

  it('adds lightweight manual ordering controls for news and activities', () => {
    expect(backofficePageSource).toContain("async function moveContentItem(section: 'news' | 'activities'");
    expect(backofficePageSource).toContain("fetch(`/api/${section}/reorder`");
    expect(backofficePageSource).toContain("onMove={(id, direction) => void moveContentItem('news', id, direction)}");
    expect(backofficePageSource).toContain("onMove={(id, direction) => void moveContentItem('activities', id, direction)}");
    expect(backofficePageSource).toContain('Subir');
    expect(backofficePageSource).toContain('Descer');
  });

  it('sends runtime backoffice sign out to Auth0 login without using the failing logout endpoint', () => {
    const signOutBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('await adminAuthClient.adapter.signOut();'),
      backofficePageSource.indexOf('{operationProgress ?')
    );

    expect(backofficePageSource).not.toContain('AUTH0_ADMIN_LOGOUT_PATH');
    expect(signOutBlock).toContain('await adminAuthClient.adapter.signOut()');
    expect(signOutBlock).toContain("router.replace('/backoffice/login')");
    expect(signOutBlock).toContain('window.location.assign(`${getAuth0AdminLoginHref()}&prompt=login`)');
    expect(signOutBlock).not.toContain('/auth/logout');
  });

  it('keeps page media editing lightweight after admin listings replace data URLs with asset routes', () => {
    const startEditGalleryBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('function startEditGallery'),
      backofficePageSource.indexOf('async function saveGalleryItem')
    );

    expect(backofficePageSource).toContain('function isGalleryAssetRoute');
    expect(startEditGalleryBlock).toContain('isGalleryAssetRoute(item.source)');
    expect(startEditGalleryBlock).toContain('!isGalleryAssetRoute(item.thumbnail)');
    expect(backofficePageSource).toContain("import Image from 'next/image'");
    expect(backofficePageSource).toContain('sizes="96px"');
    expect(backofficePageSource).toContain('preload="none"');
  });

  it('scrolls to the individual media form when editing page media items', () => {
    const startEditGalleryBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('function startEditGallery'),
      backofficePageSource.indexOf('async function saveGalleryItem')
    );

    expect(startEditGalleryBlock).toContain('setGalleryEditingId(item.id)');
    expect(startEditGalleryBlock).toContain('setSelectedGalleryIds([])');
    expect(startEditGalleryBlock).toContain('clearGalleryBatchItems()');
    expect(startEditGalleryBlock).toContain('setGalleryFormResetKey((value) => value + 1)');
    expect(startEditGalleryBlock).toContain("galleryIndividualFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })");
    expect(backofficePageSource).toContain("galleryEditingId ? 'order-1 ring-2 ring-[#0f4c36]/20' : 'order-2'");
    expect(backofficePageSource).toContain("galleryEditingId ? 'Editar media individual' : 'Media individual'");
    expect(backofficePageSource).toContain('Cancelar edição');
  });

  it('uploads rich text media before saving news content so audio is not persisted inline', () => {
    const richTextUploadBlock = backofficePageSource.slice(
      backofficePageSource.indexOf('const uploadRichTextMedia = useCallback'),
      backofficePageSource.indexOf('const uploadGalleryFileToBlob = useCallback')
    );

    expect(backofficePageSource).toContain('uploadRichTextMedia');
    expect(richTextUploadBlock).not.toContain('const INLINE_RICH_TEXT_IMAGE_MAX_BYTES');
    expect(richTextUploadBlock).not.toContain('const CLIENT_MULTIPART_UPLOAD_MIN_BYTES');
    expect(richTextUploadBlock).not.toContain('function shouldUseClientMultipartUpload(file: File)');
    expect(richTextUploadBlock).not.toContain('const uploadContentAssetFileToBlob = useCallback');
    expect(richTextUploadBlock).not.toContain("handleUploadUrl: '/api/content-assets/client-upload'");
    expect(backofficePageSource).toContain("requestJsonWithUploadProgress<{ url: string }>");
    expect(backofficePageSource).toContain("'/api/content-assets/rich-text'");
    expect(backofficePageSource).toContain("onUploadMedia={(file, kind) => uploadRichTextMedia('news', file, kind)}");
  });

  it('enables the writing window on every backoffice rich text editor', () => {
    const richTextEditorUsages = backofficePageSource.match(/<RichTextEditor/g) || [];
    const fullscreenUsages = backofficePageSource.match(/fullscreenEnabled/g) || [];

    expect(richTextEditorUsages).toHaveLength(3);
    expect(fullscreenUsages).toHaveLength(3);
    expect(backofficePageSource).toContain("onUploadMedia={(file, kind) => uploadRichTextMedia('news', file, kind)} fullscreenEnabled");
    expect(backofficePageSource).toContain("onUploadMedia={(file, kind) => uploadRichTextMedia('activities', file, kind)} fullscreenEnabled");
    expect(backofficePageSource).toContain("onUploadMedia={(file, kind) => uploadRichTextMedia('publications', file, kind)} fullscreenEnabled");
  });

  it('boots the backoffice with the lightweight stats endpoint instead of loading every module', () => {
    expect(backofficePageSource).toContain("fetchAdminEndpoint<DashboardStats>('/api/admin/stats')");
    expect(backofficePageSource).toContain('await refreshDashboardStats();');
    expect(backofficePageSource).not.toContain('await Promise.allSettled([refreshAll(), refreshGovernance(), refreshLayout(), refreshGallery(), refreshContactMessages()])');
    expect(backofficePageSource).toContain('sections.push(...(Object.keys(PROGRAMME_GALLERY_SECTIONS) as ProgrammeGallerySectionId[]))');
  });

  it('loads backoffice sections lazily with bounded admin requests', () => {
    expect(backofficePageSource).toContain('const ADMIN_CONTENT_LIST_LIMIT = 80');
    expect(backofficePageSource).toContain('const ADMIN_CONTACT_MESSAGES_LIMIT = 80');
    expect(backofficePageSource).toContain('const ADMIN_AUDIT_LIMIT = 100');
    expect(backofficePageSource).toContain('const ADMIN_GALLERY_LIST_LIMIT = 120');
    expect(backofficePageSource).toContain('const loadedContentSectionsRef = useRef<Set<ContentSection>>(new Set())');
    expect(backofficePageSource).toContain('const cachedGalleryItemsByContextRef = useRef<Map<string, GalleryMediaItem[]>>(new Map())');
    expect(backofficePageSource).toContain('const refreshContentSection = useCallback(async (section: ContentSection, force = false)');
    expect(backofficePageSource).toContain('if (!force && loadedContentSectionsRef.current.has(section))');
    expect(backofficePageSource).toContain('void refreshContentSection(activeSection as ContentSection)');
    expect(backofficePageSource).not.toContain('const refreshAll = useCallback');
    expect(backofficePageSource).not.toContain("safeFetchSection<NewsArticle>('news')");
    expect(backofficePageSource).not.toContain("safeFetchSection<Activity>('activities')");
    expect(backofficePageSource).not.toContain("safeFetchSection<Publication>('publications')");
    expect(backofficePageSource).toContain('/api/${section}?scope=admin&limit=${ADMIN_CONTENT_LIST_LIMIT}');
    expect(backofficePageSource).toContain('/api/admin/contact-messages?limit=${ADMIN_CONTACT_MESSAGES_LIMIT}');
    expect(backofficePageSource).toContain('/api/gallery?scope=admin&context=${encodeURIComponent(galleryContext)}&limit=${ADMIN_GALLERY_LIST_LIMIT}');
    expect(backofficePageSource).toContain('setGalleryItems(cachedGalleryItemsByContextRef.current.get(galleryContext) ?? [])');
    expect(backofficePageSource).toContain('cachedGalleryItemsByContextRef.current.set(galleryContext, data)');
    expect(backofficePageSource).toContain('Promise.all([refreshContentSection(section, true), refreshDashboardStats()])');
  });
});
