/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('institutional programme page', () => {
  it('does not show a misleading Consultar biblioteca button on internal pages', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'components/InstitutionalProgrammePage.tsx'),
      'utf8'
    );

    expect(source).not.toContain('Consultar biblioteca');
    expect(source).not.toContain('href="/biblioteca"');
  });

  it('renders Biblioteca JRS files from its dedicated gallery context', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/biblioteca-jrs/page.tsx'),
      'utf8'
    );

    expect(source).toContain("listGalleryMedia('public', 'biblioteca-jrs')");
    expect(source).toContain('<GalleryTabs items={media} />');
  });
});
