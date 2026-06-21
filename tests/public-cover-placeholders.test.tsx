import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock('@/components/ContentComments', () => ({
  default: () => <div data-testid="comments" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) =>
    asChild ? <>{children}</> : <button {...props}>{children}</button>,
}));

vi.mock('@/lib/prisma', () => ({
  default: {},
}));

vi.mock('@/lib/public-db-guard', () => ({
  shouldSkipPublicDb: () => true,
  isPublicDbQuotaExceededError: () => false,
  markPublicDbQuotaExceeded: vi.fn(),
}));

vi.mock('@/lib/site-layout-settings', () => ({
  getPublicSiteLayoutSettings: async () => ({
    pages: {
      noticias: { title: 'Noticias', description: 'Desc', emptyMessage: 'Sem noticias' },
      atividades: { title: 'Atividades', description: 'Desc', emptyMessage: 'Sem atividades' },
      projetos: { title: 'Projetos', description: 'Desc', emptyMessage: 'Sem projetos' },
      biblioteca: { title: 'Biblioteca', description: 'Desc', emptyMessage: 'Sem publicacoes' },
    },
  }),
}));

vi.mock('@/lib/public-content-slugs', () => ({
  getActivitySlug: (activity: { title: string }) => activity.title.toLowerCase().replace(/\s+/g, '-'),
  getProjectSlug: (project: { title: string }) => project.title.toLowerCase().replace(/\s+/g, '-'),
  getPublicationSlug: (publication: { title: string }) => publication.title.toLowerCase().replace(/\s+/g, '-'),
}));

vi.mock('@/data/site', () => ({
  siteConfig: {
    name: 'CEISCaramulo',
    url: 'https://ceiscaramulo.pt',
  },
}));

vi.mock('@/data/content', () => ({
  newsArticles: [
    {
      id: 'n1',
      title: 'Noticia sem capa',
      slug: 'noticia-sem-capa',
      excerpt: 'Resumo',
      content: '<p>Conteudo</p>',
      author: 'Autor',
      category: 'Geral',
      image: null,
      publishedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      date: '2026-01-01T00:00:00.000Z',
    },
  ],
  activities: [
    {
      id: 'a1',
      title: 'Atividade sem capa',
      description: 'Descricao',
      date: '2026-01-01T00:00:00.000Z',
      endDate: null,
      location: 'Caramulo',
      image: null,
      category: 'caminhada',
      published: true,
    },
  ],
  projects: [
    {
      id: 'p1',
      title: 'Projeto sem capa',
      description: 'Descricao',
      status: 'planeado',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: null,
      image: null,
      partners: [],
      published: true,
    },
  ],
  publications: [
    {
      id: 'b1',
      title: 'Publicacao sem capa',
      author: 'Autor',
      year: 2026,
      type: 'documento',
      description: 'Descricao',
      downloadUrl: '',
      coverImage: null,
      published: true,
    },
  ],
}));

describe('public content cover placeholders', () => {
  it('renders a placeholder for news cards without adding the cover image to the news body', async () => {
    const { default: NoticiasPage } = await import('@/app/noticias/page');
    const { default: NoticiaDetalhePage } = await import('@/app/noticias/[slug]/page');

    render(await NoticiasPage());
    expect(screen.getByRole('img', { name: 'Noticia sem capa' })).toHaveAttribute('src', '/placeholder.svg');

    render(await NoticiaDetalhePage({ params: Promise.resolve({ slug: 'noticia-sem-capa' }) }));
    expect(screen.getAllByRole('img', { name: 'Noticia sem capa' })).toHaveLength(1);
  });

  it('does not render an activity cover placeholder in activity details when the image is missing', async () => {
    const { default: AtividadeDetalhePage } = await import('@/app/atividades/[id]/page');

    render(await AtividadeDetalhePage({ params: Promise.resolve({ id: 'atividade-sem-capa' }) }));
    expect(screen.queryByRole('img', { name: 'Atividade sem capa' })).not.toBeInTheDocument();
  });

  it('renders a placeholder for publication details when images are missing', async () => {
    const { default: PublicacaoDetalhePage } = await import('@/app/biblioteca/[id]/page');

    render(await PublicacaoDetalhePage({ params: Promise.resolve({ id: 'publicacao-sem-capa' }) }));
    expect(screen.getByRole('img', { name: 'Publicacao sem capa' })).toHaveAttribute('src', '/placeholder.svg');
  });
});
