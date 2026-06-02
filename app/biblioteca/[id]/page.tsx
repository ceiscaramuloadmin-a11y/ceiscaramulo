import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Download, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentComments from '@/components/ContentComments';
import { publications as fallbackPublications } from '@/data/content';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import { getPublicationSlug } from '@/lib/public-content-slugs';
import { publicAssetValue, withPublicContentAsset } from '@/lib/public-content-assets';
import prisma from '@/lib/prisma';
import { prepareRichTextForRender } from '@/lib/richText';
import { capitalizeFirstLetter, getAssetUrl } from '@/lib/utils';
import { siteConfig } from '@/data/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface Props {
  params: Promise<{ id: string }>;
}

async function getPublication(identifier: string) {
  if (shouldSkipPublicDb()) {
    return (
      fallbackPublications.find(
        (publication) => publication.id === identifier || getPublicationSlug(publication) === identifier
      ) ?? null
    );
  }

  try {
    const publicationById = await prisma.publication.findFirst({
      where: {
        id: identifier,
        published: true,
      },
    });

    if (publicationById) {
      return withPublicContentAsset('publications', publicationById);
    }

    const publications = await prisma.publication.findMany({
      where: { published: true },
      orderBy: { year: 'desc' },
    });

    const publication = publications.find((item) => getPublicationSlug(item) === identifier) ?? null;
    return publication ? withPublicContentAsset('publications', publication) : null;
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('publication detail');
    } else {
      console.warn('Error fetching publication; using fallback data when available.');
    }
    return (
      fallbackPublications.find(
        (publication) => publication.id === identifier || getPublicationSlug(publication) === identifier
      ) ?? null
    );
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const publication = await getPublication(id);

  if (!publication) {
    return {
      title: 'Publicação não encontrada | CEISCaramulo',
      description: 'A publicação solicitada não foi encontrada.',
    };
  }

  return {
    title: `${publication.title} | CEISCaramulo`,
    description: publication.description,
    keywords: [publication.type, 'CEISCaramulo', 'Serra do Caramulo', 'biblioteca', 'publicações'],
    authors: [{ name: publication.author }],
    openGraph: {
      title: publication.title,
      description: publication.description,
      url: `https://ceiscaramulo.pt/biblioteca/${getPublicationSlug(publication)}`,
      siteName: 'CEISCaramulo',
      images: publication.coverImage
        ? [
            {
              url: publicAssetValue('publications', publication.id, publication.coverImage) || '/og-image.svg',
              width: 1200,
              height: 630,
              alt: publication.title,
            },
          ]
        : [
            {
              url: '/og-image.svg',
              width: 1200,
              height: 630,
              alt: publication.title,
            },
          ],
      locale: 'pt_PT',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: publication.title,
      description: publication.description,
      images: publication.coverImage
        ? [publicAssetValue('publications', publication.id, publication.coverImage) || '/og-image.svg']
        : ['/og-image.svg'],
    },
    alternates: {
      canonical: `/biblioteca/${getPublicationSlug(publication)}`,
    },
  };
}

export default async function PublicacaoDetalhePage({ params }: Props) {
  const { id } = await params;
  const publication = await getPublication(id);

  if (!publication) {
    notFound();
  }

  const typeLabels: Record<string, string> = {
    livro: 'Livro',
    artigo: 'Artigo',
    relatorio: 'Relatório',
    tese: 'Tese',
    documento: 'Documento',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: publication.title,
    description: publication.description,
    image: publicAssetValue('publications', publication.id, publication.coverImage) || '/og-image.svg',
    datePublished: publication.year.toString(),
    author: {
      '@type': 'Person',
      name: publication.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    genre: typeLabels[publication.type] || publication.type,
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
              <Link href="/biblioteca" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar à Biblioteca
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {publication.year}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {publication.author}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {typeLabels[publication.type] || publication.type}
              </span>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {publication.title}
          </h1>

          <div className="mt-8 overflow-hidden rounded-lg">
            <img
              src={getAssetUrl(publication.coverImage)}
              alt={publication.title}
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="mt-8 prose prose-lg max-w-none">
            <div
              className="rich-text-content text-lg leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: prepareRichTextForRender(publication.description) }}
            />
          </div>

          <div className="mt-12 rounded-lg bg-muted p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Detalhes da Publicação</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Autor</dt>
                <dd className="mt-1 text-base font-semibold">{publication.author}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Ano</dt>
                <dd className="mt-1 text-base font-semibold">{publication.year}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tipo</dt>
                <dd className="mt-1 text-base font-semibold">
                  {typeLabels[publication.type] || publication.type}
                </dd>
              </div>
            </dl>
          </div>

          {publication.downloadUrl && (
            <div className="mt-8">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a
                  href={publication.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descarregar Publicação
                </a>
              </Button>
            </div>
          )}

          <ContentComments section="publications" identifier={publication.id} title={publication.title} />
        </article>
      </main>
      <Footer />
    </>
  );
}
