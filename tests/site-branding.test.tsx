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

  it('keeps the original light green on the Serra do Caramulo hero title words', () => {
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
    expect(screen.getByText('Interpretação')).toHaveClass('ceis-hero-title-line');
    expect(screen.getByText('Serra')).toHaveClass('text-[#9dc44d]');
    expect(screen.getByText('do Caramulo')).toHaveClass('text-[#9dc44d]');
    expect(screen.getByText('do Caramulo')).toHaveClass('ceis-hero-title-line');
  });

  it('keeps the full homepage title readable on laptop-sized viewports', () => {
    const { container } = render(
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

    const heroSection = container.querySelector('section');
    const heroContent = screen.getByRole('heading', {
      level: 1,
      name: /Centro de Estudos e Interpretação da Serra do Caramulo/i,
    }).parentElement;
    const title = screen.getByRole('heading', {
      level: 1,
      name: /Centro de Estudos e Interpretação da Serra do Caramulo/i,
    });

    expect(heroSection).toHaveClass('min-h-[620px]', 'lg:min-h-[640px]');
    expect(heroContent).toHaveClass('min-h-[620px]', 'pb-12', 'pt-24');
    expect(title).toHaveClass('max-w-[21ch]', 'text-[clamp(2.75rem,5.2vw,4.6rem)]', 'leading-[1.02]');
    expect(title).not.toHaveClass('max-w-[16ch]', 'text-[clamp(3rem,6.5vw,5.1rem)]', 'leading-[0.96]');
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
                { label: 'Ligacao publica', href: '/galeria' },
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

  it('keeps the footer navigation focused on initiatives and moves the contact page link into contacts', () => {
    render(<Footer />);

    expect(screen.getByRole('heading', { name: 'Iniciativas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Oficina do Burel' })).toHaveAttribute('href', '/oficina-do-burel');
    expect(screen.getByRole('link', { name: 'Escola dos Nossos Avós' })).toHaveAttribute('href', '/escola-dos-nossos-avos');
    expect(screen.getByRole('link', { name: 'PON do Jueus' })).toHaveAttribute('href', '/pon-do-jueus');
    expect(screen.getByRole('link', { name: 'Como nos contactar' })).toHaveAttribute('href', '/contactos');
    expect(screen.queryByRole('link', { name: 'Notícias' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'A Serra do Caramulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contactos' })).not.toBeInTheDocument();
  });

  it('filters outdated fetched footer links that the contact column now owns', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...defaultSiteLayoutSettings,
        footer: {
          ...defaultSiteLayoutSettings.footer,
          columns: [
            {
              title: 'Antigos',
              links: [
                { label: 'Notícias', href: '/noticias' },
                { label: 'A Serra do Caramulo', href: '/serra-do-caramulo' },
                { label: 'Contactos', href: '/contactos' },
                { label: 'Recursos', href: '/biblioteca' },
              ],
            },
          ],
        },
      }),
    } as Response);

    render(<Footer />);

    await waitFor(() => expect(screen.getByRole('link', { name: 'Recursos' })).toBeInTheDocument());

    expect(screen.queryByRole('link', { name: 'Notícias' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'A Serra do Caramulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contactos' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Como nos contactar' })).toHaveAttribute('href', '/contactos');
  });

  it('renders footer social links as green standalone icons', () => {
    render(<Footer />);

    const instagram = screen.getByRole('link', { name: 'Instagram' });
    const facebook = screen.getByRole('link', { name: 'Facebook' });
    const linkedIn = screen.getByRole('link', { name: 'LinkedIn' });

    expect(instagram).toHaveClass('h-8', 'w-8', 'text-[#0f4c36]');
    expect(instagram).not.toHaveClass('rounded-full', 'border-2');
    expect(facebook).toHaveTextContent('f');
    expect(linkedIn).toHaveTextContent('in');
    expect(instagram).toHaveAttribute('target', '_blank');
  });

  it('renders footer contact details from fetched layout settings', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...defaultSiteLayoutSettings,
        footer: {
          ...defaultSiteLayoutSettings.footer,
          contactInfo: {
            ...defaultSiteLayoutSettings.footer.contactInfo,
            address: 'Rua Editada',
            postalCode: '1000-001',
            city: 'Tondela',
            phone: '+351 211 222 333',
            email: 'footer@ceiscaramulo.pt',
            socialMedia: {
              facebook: '',
              instagram: 'https://instagram.example/ceis',
              linkedin: '',
              youtube: '',
            },
          },
        },
      }),
    } as Response);

    render(<Footer />);

    await waitFor(() => expect(screen.getByText('Rua Editada, 1000-001, Tondela')).toBeInTheDocument());

    expect(screen.getByRole('link', { name: '+351 211 222 333' })).toHaveAttribute('href', 'tel:+351211222333');
    expect(screen.getByRole('link', { name: 'footer@ceiscaramulo.pt' })).toHaveAttribute('href', 'mailto:footer@ceiscaramulo.pt');
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.example/ceis');
    expect(screen.queryByRole('link', { name: 'Facebook' })).not.toBeInTheDocument();
  });

  it('uses distributed homepage navbar spacing without underlining the logo link', () => {
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

    const homeLogoLink = screen.getByRole('link', { name: 'CEISCaramulo - Página inicial' });
    const homepageNav = screen.getByRole('navigation', { name: 'Navegação principal da homepage' });

    expect(homeLogoLink).not.toHaveClass('border-b', 'border-[#0f4c36]/60', 'active:border-[#0f4c36]');
    expect(homeLogoLink).toHaveClass('focus-visible:ring-2', 'active:brightness-95');
    expect(homepageNav).toHaveClass('flex-1', 'justify-between', 'gap-4', '2xl:gap-6');
    expect(screen.getAllByRole('link', { name: 'Sobre Nós' })[0]).toHaveClass('px-2', '2xl:px-3', 'tracking-[0.03em]', '2xl:tracking-[0.06em]');
  });

  it('gives the expanded header more room for the full navbar and larger logo', () => {
    const { container } = render(<Header />);

    const logo = screen.getByRole('img', { name: 'CEISCaramulo' });
    const headerNav = screen.getByRole('navigation', { name: 'Navegação principal' });
    const headerInner = Array.from(container.querySelectorAll('div')).find((element) =>
      element.className.includes('max-w-[96rem]')
    );

    expect(headerInner).toHaveClass('max-w-[96rem]', 'h-28', 'gap-8');
    expect(headerNav).toHaveClass('flex-1', 'justify-between', 'gap-4');
    expect(logo).toHaveClass('h-16', 'sm:h-20');
    expect(screen.getAllByRole('link', { name: 'Sobre Nós' })[0]).toHaveClass('px-2', '2xl:px-3', 'text-[11px]', 'hover:text-[#0f4c36]');
  });

  it('uses a larger footer logo', () => {
    render(<Footer />);

    expect(screen.getByRole('img', { name: 'CEISCaramulo' })).toHaveClass('h-20', 'sm:h-24');
  });
});
