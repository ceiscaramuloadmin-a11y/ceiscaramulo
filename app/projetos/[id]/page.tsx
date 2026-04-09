import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentComments from '@/components/ContentComments';
import { projects as fallbackProjects } from '@/data/content';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import { getProjectSlug } from '@/lib/public-content-slugs';
import prisma from '@/lib/prisma';
import { formatDate, formatShortDate, capitalizeFirstLetter, getAssetUrl } from '@/lib/utils';
import { siteConfig } from '@/data/site';

interface Props {
  params: Promise<{ id: string }>;
}

async function getProject(identifier: string) {
  if (shouldSkipPublicDb()) {
    return fallbackProjects.find((project) => project.id === identifier || getProjectSlug(project) === identifier) ?? null;
  }

  try {
    const projectById = await prisma.project.findFirst({
      where: {
        id: identifier,
        published: true,
      },
    });

    if (projectById) {
      return projectById;
    }

    const projects = await prisma.project.findMany({
      where: { published: true },
      orderBy: { startDate: 'desc' },
    });

    return projects.find((project) => getProjectSlug(project) === identifier) ?? null;
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('project detail');
    } else {
      console.warn('Error fetching project; using fallback data when available.');
    }
    return fallbackProjects.find((project) => project.id === identifier || getProjectSlug(project) === identifier) ?? null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: 'Projeto não encontrado | CEISCaramulo',
      description: 'O projeto solicitado não foi encontrado.',
    };
  }

  return {
    title: `${project.title} | CEISCaramulo`,
    description: project.description,
    keywords: [project.status, 'CEISCaramulo', 'Serra do Caramulo', 'projetos'],
    openGraph: {
      title: project.title,
      description: project.description,
      url: `https://ceiscaramulo.pt/projetos/${getProjectSlug(project)}`,
      siteName: 'CEISCaramulo',
      images: project.image
        ? [
            {
              url: project.image,
              width: 1200,
              height: 630,
              alt: project.title,
            },
          ]
        : [
            {
              url: '/og-image.svg',
              width: 1200,
              height: 630,
              alt: project.title,
            },
          ],
      locale: 'pt_PT',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description,
      images: project.image ? [project.image] : ['/og-image.svg'],
    },
    alternates: {
      canonical: `/projetos/${getProjectSlug(project)}`,
    },
  };
}

export async function generateStaticParams() {
  if (shouldSkipPublicDb()) {
    return fallbackProjects.map((project) => ({
      id: getProjectSlug(project),
    }));
  }

  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: { id: true, title: true },
    });
    return projects.map((project) => ({
      id: getProjectSlug(project),
    }));
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('project static params');
    } else {
      console.warn('Error generating project static params; using fallback data.');
    }
    return fallbackProjects.map((project) => ({
      id: getProjectSlug(project),
    }));
  }
}

export default async function ProjetoDetalhePage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const statusLabels: Record<string, string> = {
    em_curso: 'Em Curso',
    concluido: 'Concluído',
    planeado: 'Planeado',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Project',
    name: project.title,
    description: project.description,
    image: project.image || '/og-image.svg',
    startDate: project.startDate,
    endDate: project.endDate || undefined,
    status: statusLabels[project.status] || project.status,
    creator: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button asChild variant="ghost" className="mb-6">
              <Link href="/projetos" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar aos Projetos
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {project.title}
          </h1>

          {project.image && (
            <div className="mt-8 overflow-hidden rounded-lg">
              <img
                src={getAssetUrl(project.image)}
                alt={project.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          <div className="mt-8 prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>

          <div className="mt-12 rounded-lg bg-muted p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Detalhes do Projeto</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Data de Início</dt>
                <dd className="mt-1 text-base font-semibold">{formatDate(project.startDate)}</dd>
              </div>
              {project.endDate && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Data de Fim</dt>
                  <dd className="mt-1 text-base font-semibold">{formatDate(project.endDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
                <dd className="mt-1 text-base font-semibold">
                  {statusLabels[project.status] || project.status}
                </dd>
              </div>
              {project.partners && project.partners.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Parceiros</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {project.partners.map((partner, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                      >
                        <Users className="h-3 w-3" />
                        {partner}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <ContentComments section="projects" identifier={project.id} title={project.title} />
        </article>
      </main>
      <Footer />
    </>
  );
}
