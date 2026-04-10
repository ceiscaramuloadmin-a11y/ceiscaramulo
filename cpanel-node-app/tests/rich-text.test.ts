import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeRichTextHtml, textToHtml } from '@/lib/richText';

describe('rich-text', () => {
  it('escapes plain text into safe html', () => {
    expect(escapeHtml(`<script>alert('x')</script>`)).toContain('&lt;script&gt;');
  });

  it('removes unsafe tags and attributes', () => {
    const html = sanitizeRichTextHtml('<p class="x">Olá</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>');
    expect(html).toContain('<p>Olá</p>');
    expect(html).not.toContain('script');
    expect(html).not.toContain('javascript:');
  });

  it('converts text blocks into paragraphs', () => {
    expect(textToHtml('Linha 1\nLinha 2\n\nLinha 3')).toBe('<p>Linha 1<br>Linha 2</p><p>Linha 3</p>');
  });
});
