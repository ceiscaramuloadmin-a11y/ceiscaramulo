/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'components/SiteAppearanceStyles.tsx'), 'utf8');
const layoutSource = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8');

describe('site appearance styles', () => {
  it('applies editable colors from public layout settings through CSS variables', () => {
    expect(source).toContain("fetch('/api/layout')");
    expect(source).toContain("root.style.setProperty('--primary'");
    expect(source).toContain("root.style.setProperty('--site-button-color'");
    expect(source).toContain("root.style.setProperty('--site-link-color'");
    expect(source).toContain("root.style.setProperty('--site-title-color'");
    expect(layoutSource).toContain('<SiteAppearanceStyles />');
  });
});
