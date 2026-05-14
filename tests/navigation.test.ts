import { describe, expect, it } from 'vitest';
import { navigationItems } from '@/data/navigation';

describe('public navigation', () => {
  it('removes the dedicated Serra navbar entry and merges library + gallery into Conteúdos e Recursos', () => {
    const hrefs = navigationItems.map((item) => item.href);
    expect(hrefs).not.toContain('/serra-do-caramulo');
    expect(hrefs).not.toContain('/galeria');
    expect(navigationItems.some((item) => item.label === 'Conteúdos e Recursos' && item.href === '/biblioteca')).toBe(true);
  });
});
