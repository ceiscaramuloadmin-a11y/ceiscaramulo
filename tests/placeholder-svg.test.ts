/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const placeholderPaths = [
  'public/placeholder.svg',
  'cpanel-node-app/public/placeholder.svg',
];

describe('placeholder svg', () => {
  it.each(placeholderPaths)('keeps %s as only the illustration without white panels or labels', (placeholderPath) => {
    const placeholderSvg = readFileSync(resolve(process.cwd(), placeholderPath), 'utf8');

    expect(placeholderSvg).not.toContain('<text');
    expect(placeholderSvg).not.toContain('CEISCaramulo');
    expect(placeholderSvg).not.toContain('Imagem indisponível');
    expect(placeholderSvg).not.toContain('Imagem indisponÃ­vel');
    expect(placeholderSvg).not.toContain('fill="#fbfcf8"');
    expect(placeholderSvg).toContain('fill="url(#sky)"');
    expect(placeholderSvg).toContain('fill="url(#hillFront)"');
  });
});
