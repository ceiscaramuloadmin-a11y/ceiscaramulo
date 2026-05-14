import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import HomeHero from '@/components/HomeHero';
import SiteLogo from '@/components/SiteLogo';

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

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('site branding', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the shared SVG logo in the header, footer, and homepage hero', () => {
    render(<Header />);
    render(<Footer />);
    render(
      <HomeHero
        hero={{
          titleLine1: 'Explorar',
          titleLine2: 'A Serra',
          titleLine3: 'Do',
          titleLine4: 'Caramulo',
          description: 'Descrição',
          primaryCtaLabel: 'Saber mais',
          primaryCtaHref: '/sobre-nos',
          secondaryCtaLabel: 'Ver atividades',
          secondaryCtaHref: '/atividades',
          imageUrl: '',
          imageAlt: 'Paisagem',
        }}
        navigationItems={[
          { label: 'Sobre Nós', href: '/sobre-nos' },
          { label: 'Atividades', href: '/atividades' },
        ]}
      />
    );

    const logos = screen.getAllByRole('img', { name: 'CEISCaramulo' });

    expect(logos).toHaveLength(3);
    logos.forEach((logo) => {
      expect(logo).toHaveAttribute('src', '/ceiscaramulo-logo.svg');
    });
  });

  it('uses the dedicated hero font class for the homepage title', () => {
    render(
      <HomeHero
        hero={{
          titleLine1: 'Explorar',
          titleLine2: 'A Serra',
          titleLine3: 'Do',
          titleLine4: 'Caramulo',
          description: 'Descrição',
          primaryCtaLabel: 'Saber mais',
          primaryCtaHref: '/sobre-nos',
          secondaryCtaLabel: 'Ver atividades',
          secondaryCtaHref: '/atividades',
          imageUrl: '',
          imageAlt: 'Paisagem',
        }}
        navigationItems={[]}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: /Explorar A Serra Do Caramulo/i })).toHaveClass('font-hero');
  });

  it('reserves intrinsic logo dimensions to avoid layout shift', () => {
    render(<SiteLogo />);

    const logo = screen.getByRole('img', { name: 'CEISCaramulo' });

    expect(logo).toHaveAttribute('width', '474');
    expect(logo).toHaveAttribute('height', '299');
  });
});
