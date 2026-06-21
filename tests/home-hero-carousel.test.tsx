import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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

describe('HomeHero image', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders only the active local hero image to keep the carousel light', () => {
    mockMatchMedia(false);
    render(<HomeHero hero={baseHero} navigationItems={[]} />);

    expect(screen.getByTestId('hero-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('hero-carousel')).toHaveClass('z-0', 'overflow-hidden');
    expect(document.querySelectorAll('.ceis-hero-slide-motion.absolute.inset-0')).toHaveLength(1);
    expect(screen.queryByText('Texto')).toBeNull();
    expect(document.querySelectorAll('img[alt="Serra"]')).toHaveLength(1);
    expect(document.querySelectorAll('.z-10.bg-\\[\\#0f4c36\\]\\/35')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /imagem anterior/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /imagem seguinte/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mostrar imagem/i })).toBeNull();
  });

  it('advances the single mounted hero image on an interval', async () => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    render(<HomeHero hero={baseHero} navigationItems={[]} />);

    const firstSrc = document.querySelector('img[alt="Serra"]')?.getAttribute('src');

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    expect(document.querySelector('img[alt="Serra"]')?.getAttribute('src')).not.toBe(firstSrc);
    expect(document.querySelectorAll('img[alt="Serra"]')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /imagem anterior/i })).toBeNull();
  });

  it('shrinks the sticky hero navigation after scrolling', async () => {
    mockMatchMedia(false);
    render(<HomeHero hero={baseHero} navigationItems={[]} />);

    const navShell = screen.getByLabelText('CEISCaramulo - Página inicial').closest('[data-shrunk]');
    expect(navShell).toHaveClass('fixed', 'top-0', 'bg-transparent');
    expect(navShell).toHaveClass('ceis-hero-nav-motion');
    expect(navShell?.className).not.toContain('backdrop-blur');
    expect(navShell?.firstElementChild).toHaveClass('rounded-full', 'bg-white/90');
    expect(navShell).toHaveAttribute('data-shrunk', 'false');

    Object.defineProperty(window, 'scrollY', { value: 32, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => expect(navShell).toHaveAttribute('data-shrunk', 'true'));
  });
});
