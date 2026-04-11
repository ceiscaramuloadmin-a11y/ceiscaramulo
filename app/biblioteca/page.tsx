import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Download, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { publications as fallbackPublications } from '@/data/content';
import { getPublicationSlug } from '@/lib/public-content-slugs';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import prisma from '@/lib/prisma';
import { prepareRichTextForRender } from '@/lib/richText';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import { capitalizeFirstLetter, getAssetUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Biblioteca | CEISCaramulo',
  description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
  keywords: ['biblioteca', 'CEISCaramulo', 'Serra do Caramulo', 'publicações', 'livros', 'artigos'],
  openGraph: {
    title: 'Biblioteca | CEISCaramulo',
    description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt/biblioteca',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Biblioteca - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Biblioteca | CEISCaramulo',
    description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/biblioteca',
  },
};

async function getPublicPublications() {
  if (shouldSkipPublicDb()) {
    return fallbackPublications;
  }

  try {
    const publications = await prisma.publication.findMany({
      where: { published: true },
      orderBy: { year: 'desc' },
    });
    return publications;
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('public publications');
    } else {
      console.warn('Error fetching publications; using fallback data.');
    }
    return fallbackPublications;
  }
}

export default async function BibliotecaPage() {
  const publications = await getPublicPublications();
  const layout = await getPublicSiteLayoutSettings();

  const typeLabels: Record<string, string> = {
    livro: 'Livro',
    artigo: 'Artigo',
    relatorio: 'Relatório',
    tese: 'Tese',
    documento: 'Documento',
  };

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {layout.pages.biblioteca.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {layout.pages.biblioteca.description}
            </p>
          </div>

          {publications.length === 0 ? (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-lg text-muted-foreground">
                {layout.pages.biblioteca.emptyMessage}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {publications.map((publication) => (
                <Link
                  key={publication.id}
                  href={`/biblioteca/${getPublicationSlug(publication)}`}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <img
                      src={getAssetUrl(publication.coverImage)}
                      alt={publication.title}
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
                  <h2 className="mt-4 font-display text-xl font-bold leading-tight text-foreground group-hover:text-primary">
                    {publication.title}
                  </h2>
                  <div
                    className="mt-2 rich-text-content overflow-hidden text-sm leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]"
                    dangerouslySetInnerHTML={{ __html: prepareRichTextForRender(publication.description) }}
                  />
                  {publication.downloadUrl && (
                    <div className="mt-4">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        <Download className="h-4 w-4" />
                        Disponível para download
                      </span>
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
