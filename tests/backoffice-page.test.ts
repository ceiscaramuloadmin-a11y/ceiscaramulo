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

  it('keeps the news slug field hidden from the backoffice form flow', () => {
    expect(backofficePageSource).not.toContain('label="Slug"');
    expect(backofficePageSource).not.toContain('newsForm.slug');
    expect(backofficePageSource).not.toContain("fd.append('slug'");
  });

  it('does not expose a manual hero image URL field in layout management', () => {
    expect(backofficePageSource).not.toContain('Hero · Imagem URL');
    expect(backofficePageSource).toContain('Hero · Upload de imagem');
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
    expect(backofficePageSource).toContain('window.confirm(');
  });

  it('renders dedicated previews for image, video and audio gallery items', () => {
    expect(backofficePageSource).toContain('function GalleryItemPreview');
    expect(backofficePageSource).toContain("if (item.type === 'photo')");
    expect(backofficePageSource).toContain("if (item.type === 'video')");
    expect(backofficePageSource).toContain('<audio controls preload="metadata"');
    expect(backofficePageSource).toContain('<video');
    expect(backofficePageSource).toContain('<img src={item.thumbnail || item.source}');
  });
});
