import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { splitHeroImageSources } from '@/lib/hero-image-sources';

describe('splitHeroImageSources', () => {
  it('returns placeholder when empty', () => {
    expect(splitHeroImageSources('')).toEqual(['/placeholder.svg']);
  });

  it('keeps base64 payloads intact', () => {
    const payload = 'data:image/png;base64,AAA|BBB';
    expect(splitHeroImageSources(payload)).toEqual([payload]);
  });

  it('splits public URLs with the pipe separator', () => {
    expect(splitHeroImageSources('/a.svg| /b.svg ')).toEqual(['/a.svg', '/b.svg']);
  });

  it('keeps the supplied institutional and programme images in the homepage carousel', () => {
    const source = readFileSync(resolve(process.cwd(), 'components/HomeHero.tsx'), 'utf8');

    expect(source).toContain('hero-ceis-7860.webp');
    expect(source).toContain('hero-ceis-7902.webp');
    expect(source).not.toContain('hero-ceis-7922.webp');
    expect(source).toContain('hero-pon-jueus-1.webp');
    expect(source).toContain('hero-pon-jueus-2.webp');
    expect(source).toContain('hero-escola-avos-1.webp');
    expect(source).toContain('hero-escola-avos-2.webp');
    expect(source).toContain('hero-escola-avos-3.webp');
  });
});
