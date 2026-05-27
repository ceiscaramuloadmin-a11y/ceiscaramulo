import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/HomeHero', () => ({
  default: () => <section data-testid="home-hero" />,
}));

vi.mock('@/components/activities/ActivitiesMonthCalendar', () => ({
  default: () => <div data-testid="activities-calendar" />,
}));

vi.mock('@/lib/prisma', () => ({
  default: {},
}));

vi.mock('@/lib/site-layout-settings', () => ({
  getPublicSiteLayoutSettings: async () => ({
    home: {
      hero: {
        eyebrow: '',
        titleLine1: 'CEISCaramulo',
        titleLine2: '',
        titleLine3: '',
        titleLine4: '',
        description: 'Desc',
        primaryCtaLabel: '',
        primaryCtaHref: '/',
        secondaryCtaLabel: '',
        secondaryCtaHref: '/',
        imageUrl: '',
        imageAlt: 'Hero',
      },
    },
  }),
}));

describe('homepage prisma fallback', () => {
  it('renders static content when prisma delegates are unavailable', async () => {
    const { default: HomePage } = await import('@/app/page');

    render(await HomePage());

    expect(screen.getByTestId('home-hero')).toBeInTheDocument();
    expect(screen.getAllByText('Atividades').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Notícias').length).toBeGreaterThan(0);
    const sectionLinks = screen.getAllByRole('link', { name: /Ver todas/i });
    expect(sectionLinks[0]).toHaveAttribute('href', '/atividades');
    expect(sectionLinks[1]).toHaveAttribute('href', '/noticias');
  });
});
