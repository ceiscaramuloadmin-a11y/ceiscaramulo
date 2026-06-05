/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const backofficePageSource = readFileSync(
  resolve(process.cwd(), 'app/backoffice/page.tsx'),
  'utf8'
);

describe('backoffice news and gallery guards', () => {
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

  it('exposes a dedicated contacts section in the backoffice with read-state actions', () => {
    expect(backofficePageSource).toContain("{ id: 'contacts', label: 'Contactos' }");
    expect(backofficePageSource).toContain('availableSections.includes(item.id)');
    expect(backofficePageSource).toContain('setActiveSection(item.id)');
    expect(backofficePageSource).toContain('Mensagens de contacto');
    expect(backofficePageSource).toContain('Marcar como lida');
    expect(backofficePageSource).toContain('Marcar como não lida');
  });

  it('keeps the requested administrative menu order with contacts and audit last', () => {
    expect(backofficePageSource).not.toContain('function sortBackofficeNavItems');
    expect(backofficePageSource).toContain('BACKOFFICE_NAV_ITEMS.filter((item) => availableSections.includes(item.id))');
    expect(backofficePageSource.indexOf("{ id: 'contacts', label: 'Contactos' }")).toBeLessThan(
      backofficePageSource.indexOf("{ id: 'audit', label: 'Auditoria' }")
    );
    expect(backofficePageSource).toContain("{ id: 'publications', label: 'Recursos' }");
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

  it('allows the appearance tab to edit footer contact details', () => {
    expect(backofficePageSource).toContain('Footer · Contactos');
    expect(backofficePageSource).toContain('Footer · Morada');
    expect(backofficePageSource).toContain('Footer · Telefone');
    expect(backofficePageSource).toContain('Footer · Email');
    expect(backofficePageSource).toContain('Footer · Instagram');
    expect(backofficePageSource).toContain('updateFooterContact');
    expect(backofficePageSource).toContain('updateFooterSocialMedia');
  });

  it('organizes appearance management into CMS-like tabs with publishing only', () => {
    expect(backofficePageSource).toContain('APPEARANCE_TABS');
    expect(backofficePageSource).toContain("'hero'");
    expect(backofficePageSource).toContain("'pages'");
    expect(backofficePageSource).toContain("'footer'");
    expect(backofficePageSource).toContain("'icons'");
    expect(backofficePageSource).toContain("'colors'");
    expect(backofficePageSource).toContain("'logos'");
    expect(backofficePageSource).toContain("'seo'");
    expect(backofficePageSource).not.toContain('Guardar rascunho');
    expect(backofficePageSource).not.toContain('Carregar rascunho');
    expect(backofficePageSource).toContain('Publicar Alterações');
    expect(backofficePageSource).toContain('Pré-visualização');
    expect(backofficePageSource).toContain('updateVisualColor');
    expect(backofficePageSource).toContain('updateSeo');
    expect(backofficePageSource).toContain('updateLogo');
  });

  it('adds all public frontend pages to the appearance page editor', () => {
    expect(backofficePageSource).toContain('APPEARANCE_PAGE_FIELDS');
    expect(backofficePageSource).toContain("'bibliotecaJrs'");
    expect(backofficePageSource).toContain("'contactos'");
    expect(backofficePageSource).toContain("'escolaDosNossosAvos'");
    expect(backofficePageSource).toContain("'galeria'");
    expect(backofficePageSource).toContain("'oficinaDoBurel'");
    expect(backofficePageSource).toContain("'oficinasDeFormacao'");
    expect(backofficePageSource).toContain("'ponDoJueus'");
    expect(backofficePageSource).toContain("'publicacoes'");
    expect(backofficePageSource).toContain('updateAppearancePage');
    expect(backofficePageSource).toContain('Mensagem sem conteúdos');
  });

  it('shows the audio upload size guidance in the batch gallery flow', () => {
    expect(backofficePageSource).toContain('MAX_INLINE_AUDIO_UPLOAD_BYTES');
    expect(backofficePageSource).toContain('getInlineAudioUploadErrorMessage()');
  });

  it('separates gallery media by type and supports multi-select deletion', () => {
    expect(backofficePageSource).toContain('<GalleryGroup');
    expect(backofficePageSource).toContain('title="Fotos"');
    expect(backofficePageSource).toContain('title="Vídeos"');
    expect(backofficePageSource).toContain('title="Áudios"');
    expect(backofficePageSource).toContain('toggleGalleryTypeSelection');
    expect(backofficePageSource).toContain('deleteSelectedGalleryItems');
    expect(backofficePageSource).toContain('selectedVisibleGalleryIds');
    expect(backofficePageSource).toContain('Promise.all(ids.map((id) => fetchAdminEndpoint<null>');
    expect(backofficePageSource).toContain('window.confirm(');
  });

  it('resets gallery creation state when the new button is used', () => {
    expect(backofficePageSource).toContain('function startNewGalleryItem');
    expect(backofficePageSource).toContain('setSelectedGalleryIds([])');
    expect(backofficePageSource).toContain('clearGalleryBatchItems()');
    expect(backofficePageSource).toContain('galleryIndividualFormRef.current?.scrollIntoView');
    expect(backofficePageSource).toContain('galleryFormResetKey');
    expect(backofficePageSource).toContain('onClick={startNewGalleryItem}');
  });

  it('adds programme gallery sections for PON, Escola dos Nossos Avos and Oficinas de formacao', () => {
    expect(backofficePageSource).toContain("'gallery-pon-do-jueus'");
    expect(backofficePageSource).toContain("'gallery-escola-dos-nossos-avos'");
    expect(backofficePageSource).toContain("'gallery-oficinas-de-formacao'");
    expect(backofficePageSource).toContain('PROGRAMME_GALLERY_SECTIONS');
    expect(backofficePageSource).toContain("fd.append('context', activeGalleryConfig?.context || 'global')");
    expect(backofficePageSource).toContain('/api/gallery?scope=admin&context=');
  });

  it('uploads gallery batches with bounded parallel requests', () => {
    expect(backofficePageSource).toContain('const uploadConcurrency = 3');
    expect(backofficePageSource).toContain('Promise.all(galleryBatchItems.slice(index, index + uploadConcurrency).map(uploadOne))');
  });

  it('renders dedicated previews for image, video and audio gallery items', () => {
    expect(backofficePageSource).toContain('function GalleryItemPreview');
    expect(backofficePageSource).toContain('Sem origem');
    expect(backofficePageSource).toContain("if (item.type === 'photo')");
    expect(backofficePageSource).toContain("if (item.type === 'video')");
    expect(backofficePageSource).toContain('<audio controls preload="metadata"');
    expect(backofficePageSource).toContain('<video');
    expect(backofficePageSource).toContain("item.thumbnail || item.source || '/placeholder.svg'");
  });
});
