import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone, TreePine, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HomeHero from '@/components/HomeHero';
import { activities as fallbackActivities, newsArticles as fallbackNewsArticles, projects as fallbackProjects } from '@/data/content';
import { navigationItems } from '@/data/navigation';
import { contactInfo, siteConfig } from '@/data/site';
import { getActivitySlug, getProjectSlug } from '@/lib/public-content-slugs';
import { prepareRichTextForRender } from '@/lib/richText';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import prisma from '@/lib/prisma';
import { getAssetUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
  description:
    'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
  keywords: [
    'CEISCaramulo',
    'Serra do Caramulo',
    'associação',
    'património natural',
    'património cultural',
    'notícias',
    'atividades',
    'projetos',
    'biblioteca',
    'conservação da natureza',
    'educação ambiental',
    'Tondela',
    'Viseu',
  ],
  openGraph: {
    title: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
    description:
      'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'CEISCaramulo - Serra do Caramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CEISCaramulo — Centro de Estudos e Interpretação da Serra do Caramulo',
    description:
      'Associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/',
  },
};

const footerPrimaryLinks = navigationItems.slice(0, 4);
const footerExploreLinks = [
  { label: 'Biblioteca', href: '/biblioteca' },
  { label: 'A Serra do Caramulo', href: '/serra-do-caramulo' },
  { label: 'Galeria Multimédia', href: '/galeria' },
  { label: 'Contactos', href: '/contactos' },
];

const formatLongDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatShortDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

async function getPublicNews() {
  try {
    const news = await prisma.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 2,
    });
    return news;
  } catch (error) {
    console.error('Error fetching news:', error);
    return fallbackNewsArticles.slice(0, 2).map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category,
      image: article.image ?? null,
      publishedAt: article.date,
      createdAt: article.date,
    }));
  }
}

async function getPublicActivities() {
  try {
    const activities = await prisma.activity.findMany({
      where: { published: true },
      orderBy: { date: 'asc' },
      take: 3,
    });
    return activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return fallbackActivities.slice(0, 3).map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      location: activity.location,
      image: activity.image ?? null,
      category: activity.category,
    }));
  }
}

async function getPublicProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      orderBy: { startDate: 'desc' },
      take: 3,
    });
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return fallbackProjects.slice(0, 3).map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate ?? null,
      image: project.image ?? null,
      partners: project.partners ?? [],
    }));
  }
}

export default async function HomePage() {
  const currentYear = new Date().getFullYear();
  const newsArticles = await getPublicNews();
  const activities = await getPublicActivities();
  const projects = await getPublicProjects();
  const layout = await getPublicSiteLayoutSettings();

  return (
    <div className="bg-white text-foreground">
      <HomeHero hero={layout.home.hero} navigationItems={navigationItems} />

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Próximas</p>
              <h2 className="mt-2 font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
                Atividades
              </h2>
            </div>
            <Link
              href="/atividades"
              className="inline-flex items-center gap-1 text-sm text-[#666] transition-colors hover:text-primary"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/atividades/${getActivitySlug(activity)}`}
                className="rounded-xl border border-[#f1f3f5] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-34px_rgba(0,0,0,0.3)]"
              >
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={getAssetUrl(activity.image)}
                    alt={activity.title}
                    className="h-48 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
                <span className="inline-flex rounded-md bg-[#f4f5f7] px-2 py-1 text-[10px] font-medium text-[#666]">
                  {capitalize(activity.category)}
                </span>
                <h3 className="mt-4 overflow-hidden font-display text-[1.75rem] font-bold leading-[1.12] text-[#1a1a1a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                  {activity.title}
                </h3>
                <div
                  className="mt-4 rich-text-content overflow-hidden text-sm leading-[1.65] text-[#666] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]"
                  dangerouslySetInnerHTML={{ __html: prepareRichTextForRender(activity.description) }}
                />
                <p className="mt-6 text-[11px] text-[#8a8a8a]">
                  {activity.location} • {formatShortDate(activity.date)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fa] px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Últimas</p>
              <h2 className="mt-2 font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
                Notícias
              </h2>
            </div>
            <Link
              href="/noticias"
              className="inline-flex items-center gap-1 text-sm text-[#666] transition-colors hover:text-primary"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {newsArticles.map((article) => (
              <Link
                key={article.id}
                href={`/noticias/${article.slug}`}
                className="rounded-xl border border-[#f1f3f5] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-34px_rgba(0,0,0,0.3)]"
              >
                <div className="mb-6 overflow-hidden rounded-lg">
                  <img
                    src={getAssetUrl(article.image)}
                    alt={article.title}
                    className="h-56 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#888]">
                  {formatLongDate(article.publishedAt || article.createdAt || '')} • {article.category}
                </p>
                <h3 className="mt-6 overflow-hidden font-display text-[2rem] font-bold leading-[1.04] text-[#1a1a1a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                  {article.title}
                </h3>
                <div
                  className="mt-6 rich-text-content max-w-[34rem] overflow-hidden text-sm leading-[1.65] text-[#666] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]"
                  dangerouslySetInnerHTML={{ __html: prepareRichTextForRender(article.excerpt) }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Em Destaque</p>
              <h2 className="mt-2 font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
                Projetos
              </h2>
            </div>
            <Link
              href="/projetos"
              className="inline-flex items-center gap-1 text-sm text-[#666] transition-colors hover:text-primary"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projetos/${getProjectSlug(project)}`}
                className="rounded-xl border border-[#f1f3f5] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-34px_rgba(0,0,0,0.3)]"
              >
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={getAssetUrl(project.image)}
                    alt={project.title}
                    className="h-48 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
                <span className="inline-flex rounded-md bg-[#f4f5f7] px-2 py-1 text-[10px] font-medium text-[#666]">
                  {capitalize(project.status)}
                </span>
                <h3 className="mt-4 overflow-hidden font-display text-[1.75rem] font-bold leading-[1.12] text-[#1a1a1a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                  {project.title}
                </h3>
                <div
                  className="mt-4 rich-text-content overflow-hidden text-sm leading-[1.65] text-[#666] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]"
                  dangerouslySetInnerHTML={{ __html: prepareRichTextForRender(project.description) }}
                />
                <p className="mt-6 text-[11px] text-[#8a8a8a]">
                  {formatShortDate(project.startDate)}
                  {project.endDate ? ` • ${formatShortDate(project.endDate)}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-4 sm:px-6">
        <div className="mx-auto max-w-[1024px] rounded-[20px] bg-[#f4f5f7] px-6 py-16 text-center sm:px-12">
          <h2 className="font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
            {layout.home.join.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#666]">
            {layout.home.join.description}
          </p>
          <Button
            asChild
            className="mt-8 h-12 rounded-md bg-primary px-8 text-sm font-semibold text-white hover:bg-primary/95"
          >
            <Link href={layout.home.join.ctaHref}>{layout.home.join.ctaLabel}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#f3f4f6] bg-white px-4 pb-8 pt-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 pb-16 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="CEISCaramulo - Página inicial">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TreePine className="h-4 w-4" />
                </span>
                <span className="text-lg font-bold tracking-[-0.02em]">CEISCaramulo</span>
              </Link>
              <p className="max-w-[17rem] text-sm leading-[1.65] text-[#666]">{siteConfig.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">Navegação</h3>
              <div className="mt-6 grid gap-4">
                {footerPrimaryLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-[#666] transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">Explorar</h3>
              <div className="mt-6 grid gap-4">
                {footerExploreLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-[#666] transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">Contactos</h3>
              <div className="mt-6 grid gap-4 text-sm text-[#666]">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8fb339]" />
                  <p>
                    {contactInfo.address}, {contactInfo.postalCode} {contactInfo.city}
                  </p>
                </div>
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-3 transition-colors hover:text-primary">
                  <Phone className="h-4 w-4 shrink-0 text-[#8fb339]" />
                  <span>{contactInfo.phone}</span>
                </a>
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 transition-colors hover:text-primary">
                  <Mail className="h-4 w-4 shrink-0 text-[#8fb339]" />
                  <span>{contactInfo.email}</span>
                </a>
              </div>
              <div className="mt-6 flex items-center gap-4">
                {contactInfo.socialMedia.facebook ? (
                  <a
                    href={contactInfo.socialMedia.facebook}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="text-[#666] transition-colors hover:text-primary"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                ) : null}
                {contactInfo.socialMedia.instagram ? (
                  <a
                    href={contactInfo.socialMedia.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="text-[#666] transition-colors hover:text-primary"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                ) : null}
                {contactInfo.socialMedia.youtube ? (
                  <a
                    href={contactInfo.socialMedia.youtube}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="text-[#666] transition-colors hover:text-primary"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-[#f9fafb] pt-8 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#666]">
              © {currentYear} CEISCaramulo. Todos os direitos reservados.
            </p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#666]">
              Associação sem fins lucrativos
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
