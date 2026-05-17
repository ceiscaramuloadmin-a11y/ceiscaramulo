import { describe, expect, it } from 'vitest';
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
});
