import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projects as fallbackProjects } from '@/data/content';
import { getProjectSlug } from '@/lib/public-content-slugs';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import prisma from '@/lib/prisma';
import { richTextToPlainText } from '@/lib/richText';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import { formatShortDate, getAssetUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Projetos | CEISCaramulo',
  description: 'Projetos de investigação, conservação e educação ambiental do CEISCaramulo na Serra do Caramulo.',
  keywords: ['projetos', 'CEISCaramulo', 'Serra do Caramulo', 'investigação', 'conservação'],
  openGraph: {
    title: 'Projetos | CEISCaramulo',
    description: 'Projetos de investigação, conservação e educação ambiental do CEISCaramulo na Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt/projetos',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Projetos - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Projetos | CEISCaramulo',
    description: 'Projetos de investigação, conservação e educação ambiental do CEISCaramulo na Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/projetos',
  },
};

async function getPublicProjects() {
  if (shouldSkipPublicDb()) {
    return fallbackProjects;
  }

  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      orderBy: { startDate: 'desc' },
    });
    return projects;
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('public projects');
    } else {
      console.warn('Error fetching projects; using fallback data.');
    }
    return fallbackProjects;
  }
}

export default async function ProjetosPage() {
  const projects = await getPublicProjects();
  const layout = await getPublicSiteLayoutSettings();

  const statusLabels: Record<string, string> = {
    em_curso: 'Em Curso',
    concluido: 'Concluído',
    planeado: 'Planeado',
  };

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {layout.pages.projetos.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {layout.pages.projetos.description}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-lg text-muted-foreground">
                {layout.pages.projetos.emptyMessage}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projetos/${getProjectSlug(project)}`}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <img
                      src={getAssetUrl(project.image)}
                      alt={project.title}
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatShortDate(project.startDate)}
                      {project.endDate && ` - ${formatShortDate(project.endDate)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {statusLabels[project.status] || project.status}
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-bold leading-tight text-foreground group-hover:text-primary">
                    {project.title}
                  </h2>
                  <p className="mt-2 overflow-hidden text-sm leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                    {richTextToPlainText(project.description)}
                  </p>
                  {project.partners && project.partners.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.partners.slice(0, 2).map((partner, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          <Users className="h-3 w-3" />
                          {partner}
                        </span>
                      ))}
                      {project.partners.length > 2 && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                          +{project.partners.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Ver detalhes
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
