import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

vi.mock('swiper/modules', () => ({
  Autoplay: {},
  EffectFade: {},
}));

vi.mock('swiper/react', () => ({
  Swiper: ({
    children,
    className,
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="hero-swiper" className={className}>
      {children}
    </div>
  ),
  SwiperSlide: ({
    children,
    className,
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="hero-swiper-slide" className={className}>
      {children}
    </div>
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
  });

  it('renders the local hero image folder as an image-only swiper', () => {
    mockMatchMedia(false);
    render(<HomeHero hero={baseHero} navigationItems={[]} />);

    expect(screen.getByTestId('hero-swiper')).toBeInTheDocument();
    expect(screen.getByTestId('hero-swiper')).toHaveClass('z-0');
    expect(screen.getAllByTestId('hero-swiper-slide')).toHaveLength(2);
    expect(screen.queryByText('Texto')).toBeNull();
    expect(document.querySelectorAll('img[alt="Serra"]')).toHaveLength(2);
    expect(document.querySelectorAll('.z-10.bg-\\[\\#27441d\\]\\/35')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /imagem anterior/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /imagem seguinte/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mostrar imagem/i })).toBeNull();
  });

  it('does not render carousel controls for a single image', () => {
    mockMatchMedia(false);
    render(
      <HomeHero
        hero={{ ...baseHero, imageUrl: '/only.jpg' }}
        navigationItems={[]}
      />,
    );

    expect(screen.queryByRole('button', { name: /imagem anterior/i })).toBeNull();
    expect(document.querySelectorAll('img[alt="Serra"]')).toHaveLength(2);
  });

  it('shrinks the sticky hero navigation after scrolling', async () => {
    mockMatchMedia(false);
    render(<HomeHero hero={baseHero} navigationItems={[]} />);

    const navShell = screen.getByLabelText('CEISCaramulo - Página inicial').closest('[data-shrunk]');
    expect(navShell).toHaveClass('fixed', 'top-0', 'bg-transparent');
    expect(navShell?.className).not.toContain('backdrop-blur');
    expect(navShell?.firstElementChild).toHaveClass('rounded-full', 'bg-white/90');
    expect(navShell).toHaveAttribute('data-shrunk', 'false');

    Object.defineProperty(window, 'scrollY', { value: 32, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => expect(navShell).toHaveAttribute('data-shrunk', 'true'));
  });
});
