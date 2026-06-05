import { describe, expect, it } from 'vitest';
import { navigationItems } from '@/data/navigation';

describe('public navigation', () => {
  it('labels the public resource area consistently', () => {
    const hrefs = navigationItems.map((item) => item.href);
    expect(hrefs).not.toContain('/serra-do-caramulo');
    expect(hrefs).not.toContain('/galeria');
    expect(navigationItems.some((item) => item.label === 'Recursos' && item.href === '/biblioteca')).toBe(true);
    expect(navigationItems.some((item) => item.label === 'Conteúdos e Recursos')).toBe(false);
  });

  it('omits activities, news, and contacts from the navbar tabs', () => {
    const hrefs = navigationItems.map((item) => item.href);

    expect(hrefs).not.toContain('/atividades');
    expect(hrefs).not.toContain('/noticias');
    expect(hrefs).not.toContain('/contactos');
  });

  it('includes the institutional programme pages requested for the navbar', () => {
    expect(navigationItems).toEqual(
      expect.arrayContaining([
        { label: 'Oficina do Burel', href: '/oficina-do-burel' },
        { label: 'PON do Jueus', href: '/pon-do-jueus' },
        { label: 'Escola dos Nossos Avós', href: '/escola-dos-nossos-avos' },
        { label: 'Biblioteca JRS', href: '/biblioteca-jrs' },
        { label: 'Oficinas de formação', href: '/oficinas-de-formacao' },
        { label: 'Publicações', href: '/publicacoes' },
      ]),
    );
  });
});
