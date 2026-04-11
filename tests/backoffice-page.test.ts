/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const backofficePageSource = readFileSync(
  resolve(process.cwd(), 'app/backoffice/page.tsx'),
  'utf8'
);

describe('backoffice news and gallery guards', () => {
  it('keeps the news slug field hidden from the backoffice form flow', () => {
    expect(backofficePageSource).not.toContain('label="Slug"');
    expect(backofficePageSource).not.toContain('newsForm.slug');
    expect(backofficePageSource).not.toContain("fd.append('slug'");
  });

  it('shows the audio upload size guidance in the batch gallery flow', () => {
    expect(backofficePageSource).toContain('MAX_INLINE_AUDIO_UPLOAD_BYTES');
    expect(backofficePageSource).toContain('getInlineAudioUploadErrorMessage()');
  });
});
