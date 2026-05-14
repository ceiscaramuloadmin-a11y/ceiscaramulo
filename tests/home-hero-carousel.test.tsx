import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeHero from '@/components/HomeHero';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function mockMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reducedMotion,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

const baseHero = {
  titleLine1: 'T1',
  titleLine2: 'T2',
  titleLine3: 'T3',
  titleLine4: 'T4',
  description: 'Texto',
  primaryCtaLabel: 'A',
  primaryCtaHref: '/a',
  secondaryCtaLabel: 'B',
  secondaryCtaHref: '/b',
  imageUrl: '/one.jpg|/two.jpg|/three.jpg',
  imageAlt: 'Serra',
};

describe('HomeHero carousel', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('mostra controlos anterior/seguinte e pontos quando há várias imagens', () => {
    mockMatchMedia(false);
    render(<HomeHero hero={baseHero} navigationItems={[]} />);

    expect(screen.getByRole('button', { name: /imagem anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /imagem seguinte/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Mostrar imagem \d de 3/i })).toHaveLength(3);
  });

  it('o botão seguinte activa o segundo indicador', () => {
    mockMatchMedia(false);
    render(<HomeHero hero={baseHero} navigationItems={[]} />);

    const dot1 = screen.getByRole('button', { name: /Mostrar imagem 1 de 3/i });
    const dot2 = screen.getByRole('button', { name: /Mostrar imagem 2 de 3/i });
    expect(dot1).toHaveAttribute('aria-current', 'true');

    fireEvent.click(screen.getByRole('button', { name: /imagem seguinte/i }));

    expect(dot2).toHaveAttribute('aria-current', 'true');
  });

  it('com uma única imagem, não mostra controlo do carrossel', () => {
    mockMatchMedia(false);
    render(
      <HomeHero
        hero={{ ...baseHero, imageUrl: '/only.jpg' }}
        navigationItems={[]}
      />,
    );

    expect(screen.queryByRole('button', { name: /imagem anterior/i })).toBeNull();
  });
});
