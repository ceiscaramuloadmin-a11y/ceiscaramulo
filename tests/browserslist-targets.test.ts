import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('compatibilidade de browsers (polyfills)', () => {
  it('package.json lista Edge nas versões suportadas (Chromium)', () => {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { browserslist?: string[] };
    expect(Array.isArray(pkg.browserslist)).toBe(true);
    const flat = pkg.browserslist!.join('\n').toLowerCase();
    expect(flat.includes('edge')).toBe(true);
  });
});
