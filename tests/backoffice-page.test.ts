/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const backofficePageSource = readFileSync(
  resolve(process.cwd(), 'app/backoffice/page.tsx'),
  'utf8'
);

describe('backoffice news and gallery guards', () => {
  it('exposes a dedicated contacts section in the backoffice with read-state actions', () => {
    expect(backofficePageSource).toContain("availableSections.includes('contacts')");
    expect(backofficePageSource).toContain("setActiveSection('contacts')");
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
