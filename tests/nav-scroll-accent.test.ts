import { describe, expect, it } from 'vitest';
import { NAV_SCROLL_ELEVATION_PX, navBarElevatedClasses } from '@/lib/nav-scroll-accent';

describe('navBarElevatedClasses', () => {
  it(`não aplica classe até ~${NAV_SCROLL_ELEVATION_PX}px`, () => {
    expect(navBarElevatedClasses(0)).toBe('');
    expect(navBarElevatedClasses(NAV_SCROLL_ELEVATION_PX)).toBe('');
  });

  it('global: shadow mais suave quando desce mais, sem blur', () => {
    const elevated = navBarElevatedClasses(NAV_SCROLL_ELEVATION_PX + 1, 'global');
    expect(elevated).toContain('shadow-[0_8px_24px_-18px_rgba(0,0,0,0.18)]');
    expect(elevated).not.toContain('backdrop-blur');
  });

  it('hero: mantém sombra mais marcada sobre imagens', () => {
    const elevated = navBarElevatedClasses(NAV_SCROLL_ELEVATION_PX + 1, 'hero');
    expect(elevated).toContain('shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]');
  });
});
