import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import HomeHero from '@/components/HomeHero';
import SiteLogo from '@/components/SiteLogo';
import { defaultSiteLayoutSettings } from '@/lib/site-layout';

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

  it('uses the logo green for the highlighted homepage title word', () => {
    render(
      <HomeHero
        hero={{
          titleLine1: 'Centro de Estudos e',
          titleLine2: 'Interpretação',
          titleLine3: 'da Serra',
          titleLine4: 'do Caramulo',
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

    expect(screen.getByText('Interpretação')).toHaveClass('text-white');
  });

  it('reserves intrinsic logo dimensions to avoid layout shift', () => {
    render(<SiteLogo />);

    const logo = screen.getByRole('img', { name: 'CEISCaramulo' });

    expect(logo).toHaveAttribute('width', '474');
    expect(logo).toHaveAttribute('height', '299');
  });

  it('shrinks the fixed header after scrolling', async () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed', 'top-0', 'bg-white/95');
    expect(header.className).not.toContain('backdrop-blur');
    expect(header).toHaveAttribute('data-shrunk', 'false');

    Object.defineProperty(window, 'scrollY', { value: 32, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => expect(header).toHaveAttribute('data-shrunk', 'true'));
  });

  it('keeps the expanded navbar for extra-wide screens after adding more links', () => {
    render(<Header />);

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toHaveClass('xl:flex');
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveClass('xl:hidden');
  });

  it('hides restricted admin topics from fetched footer settings', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...defaultSiteLayoutSettings,
        footer: {
          ...defaultSiteLayoutSettings.footer,
          columns: [
            ...defaultSiteLayoutSettings.footer.columns,
            {
              title: 'Área Restrita',
              links: [
                { label: 'Backoffice', href: '/backoffice' },
                { label: 'Login Administrativo', href: '/backoffice/login' },
              ],
            },
            {
              title: 'Misto',
              links: [
                { label: 'Ligacao publica', href: '/contactos' },
                { label: 'Backoffice direto', href: '/backoffice' },
              ],
            },
          ],
        },
      }),
    } as Response);

    render(<Footer />);

    await waitFor(() => expect(screen.getByText('Ligacao publica')).toBeInTheDocument());

    expect(screen.queryByText('Área Restrita')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Backoffice' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Login Administrativo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Backoffice direto' })).not.toBeInTheDocument();
  });

  it('renders footer social links as green standalone icons', () => {
    render(<Footer />);

    const instagram = screen.getByRole('link', { name: 'Instagram' });
    const facebook = screen.getByRole('link', { name: 'Facebook' });
    const linkedIn = screen.getByRole('link', { name: 'LinkedIn' });

    expect(instagram).toHaveClass('h-8', 'w-8', 'text-[#3e5c32]');
    expect(instagram).not.toHaveClass('rounded-full', 'border-2');
    expect(facebook).toHaveTextContent('f');
    expect(linkedIn).toHaveTextContent('in');
    expect(instagram).toHaveAttribute('target', '_blank');
  });

  it('uses tighter homepage navbar tracking so the tabs read compactly', () => {
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
        navigationItems={[{ label: 'Sobre Nós', href: '/sobre-nos' }]}
      />
    );

    expect(screen.getAllByRole('link', { name: 'Sobre Nós' })[0]).toHaveClass('tracking-[0.03em]', '2xl:tracking-[0.06em]');
  });

  it('gives the expanded header more room for the full navbar and larger logo', () => {
    const { container } = render(<Header />);

    const logo = screen.getByRole('img', { name: 'CEISCaramulo' });
    const headerInner = Array.from(container.querySelectorAll('div')).find((element) =>
      element.className.includes('max-w-[96rem]')
    );

    expect(headerInner).toHaveClass('max-w-[96rem]', 'h-24');
    expect(logo).toHaveClass('h-14', 'sm:h-16');
    expect(screen.getAllByRole('link', { name: 'Sobre Nós' })[0]).toHaveClass('text-[11px]', 'hover:text-[#0f4c36]');
  });
});
