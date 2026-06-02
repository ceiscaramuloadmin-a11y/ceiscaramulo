/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const placeholderSvg = readFileSync(resolve(process.cwd(), 'public/placeholder.svg'), 'utf8');

describe('placeholder svg', () => {
  it('keeps only the illustration without white text panels or embedded labels', () => {
    expect(placeholderSvg).not.toContain('<text');
    expect(placeholderSvg).not.toContain('CEISCaramulo');
    expect(placeholderSvg).not.toContain('Imagem indisponível');
    expect(placeholderSvg).not.toContain('fill="#fbfcf8"');
    expect(placeholderSvg).toContain('fill="url(#sky)"');
    expect(placeholderSvg).toContain('fill="url(#hillFront)"');
  });
});
