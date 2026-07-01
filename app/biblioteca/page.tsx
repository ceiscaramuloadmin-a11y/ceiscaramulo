import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Download, Search, Tag, User } from 'lucide-react';
import GalleryTabs from '@/components/GalleryTabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { listGalleryMedia } from '@/app/api/_lib/cms';
import { publications as fallbackPublications } from '@/data/content';
import {
  bibliotecaPublicationTypes,
  filterBibliotecaByQuery,
  filterBibliotecaByTipo,
  parseBibliotecaQueryParam,
  parseBibliotecaTipoParam,
} from '@/lib/biblioteca-filters';
import { getPublicationSlug } from '@/lib/public-content-slugs';
import { withPublicContentAsset } from '@/lib/public-content-assets';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import prisma from '@/lib/prisma';
import { richTextToPlainText } from '@/lib/richText';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import { capitalizeFirstLetter, cn, getAssetUrl, shouldBypassNextImageOptimization } from '@/lib/utils';
import type { Publication, PublicationType } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Recursos | CEISCaramulo',
  description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
  keywords: ['biblioteca', 'CEISCaramulo', 'Serra do Caramulo', 'publicações', 'livros', 'artigos'],
  openGraph: {
    title: 'Recursos | CEISCaramulo',
    description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt/biblioteca',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Recursos - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recursos | CEISCaramulo',
    description: 'Publicações, livros, artigos e documentos do CEISCaramulo sobre a Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/biblioteca',
  },
};

const bibliotecaHeroImage = '/internal-pages/biblioteca.jpg';
const MAX_PUBLIC_BIBLIOTECA_RESULTS = 60;
const publicationTypeValues: PublicationType[] = ['livro', 'artigo', 'relatorio', 'tese', 'documento'];

type PublicBibliotecaPublication = Omit<Publication, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

function buildBibliotecaPublicationWhere(tipo: PublicationType | null, query: string) {
  const trimmedQuery = query.trim();
  const normalizedTypeQuery = trimmedQuery.toLowerCase();
  const queryYear = /^\d{1,4}$/.test(trimmedQuery) ? Number.parseInt(trimmedQuery, 10) : null;

  return {
    published: true,
    ...(tipo ? { type: tipo } : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { title: { contains: trimmedQuery, mode: 'insensitive' as const } },
            { author: { contains: trimmedQuery, mode: 'insensitive' as const } },
            { description: { contains: trimmedQuery, mode: 'insensitive' as const } },
            ...(queryYear ? [{ year: queryYear }] : []),
            ...(publicationTypeValues.includes(normalizedTypeQuery as PublicationType)
              ? [{ type: normalizedTypeQuery as PublicationType }]
              : []),
          ],
        }
      : {}),
  };
}

function OptimizedPublicationCover({ src, alt, className }: { src: string; alt: string; className: string }) {
  if (!src.startsWith('/') || shouldBypassNextImageOptimization(src)) {
    return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />;
  }

  return <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className={className} />;
}

async function getPublicPublicationTypes(): Promise<string[]> {
  if (shouldSkipPublicDb()) {
    return bibliotecaPublicationTypes(fallbackPublications);
  }

  try {
    const types = await prisma.publication.findMany({
      where: { published: true },
      distinct: ['type'],
      select: { type: true },
      orderBy: { type: 'asc' },
    });
    return bibliotecaPublicationTypes(types);
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('public publication types');
    } else {
      console.warn('Error fetching publication types; using fallback data.');
    }
    return bibliotecaPublicationTypes(fallbackPublications);
  }
}

async function getPublicPublications(tipo: PublicationType | null, query: string): Promise<PublicBibliotecaPublication[]> {
  if (shouldSkipPublicDb()) {
    return filterBibliotecaByQuery(filterBibliotecaByTipo(fallbackPublications, tipo), query);
  }

  try {
    const publications = await prisma.publication.findMany({
      where: buildBibliotecaPublicationWhere(tipo, query),
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
      take: MAX_PUBLIC_BIBLIOTECA_RESULTS,
    });
    return publications.map((publication) => withPublicContentAsset('publications', publication));
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('public publications');
    } else {
      console.warn('Error fetching publications; using fallback data.');
    }
    return filterBibliotecaByQuery(filterBibliotecaByTipo(fallbackPublications, tipo), query);
  }
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const tipoRaw = sp.tipo;
  const query = parseBibliotecaQueryParam(sp.q);
  const distinctTypes = await getPublicPublicationTypes();
  const tipo = parseBibliotecaTipoParam(tipoRaw, distinctTypes);
  const publications = await getPublicPublications(tipo as PublicationType | null, query);
  const layout = await getPublicSiteLayoutSettings();
  const media = await listGalleryMedia('public', 'biblioteca');
  const querySuffix = query ? `&q=${encodeURIComponent(query)}` : '';
  const hasPublications = distinctTypes.length > 0 || publications.length > 0;

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
      <main id="main-content" className="min-h-screen bg-[#f4f6ee] pt-20">
        <section
          className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden bg-[#0f4c36] px-4 py-16 text-center"
        >
          <Image
            src={bibliotecaHeroImage}
            alt=""
            fill
            priority={false}
            sizes="100vw"
            className="absolute inset-0 z-0 object-cover"
          />
          <div className="pointer-events-none absolute inset-0 z-0 bg-black/45" />
          <div className="relative z-10 mx-auto max-w-4xl text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">CEISCaramulo</p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight !text-white sm:text-6xl lg:text-7xl">
              Recursos
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl font-medium leading-relaxed text-white">
              {layout.pages.biblioteca.description}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {hasPublications && (
            <section className="mb-8 rounded-xl border border-stone-200 bg-white p-5">
              <form action="/biblioteca" className="grid gap-3 md:grid-cols-[1fr_auto]" role="search">
                {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
                <label className="relative block">
                  <span className="sr-only">Pesquisar recursos</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Pesquisar por título, autor, ano ou tema"
                    className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#0f4c36] focus:ring-2 focus:ring-[#0f4c36]/15"
                  />
                </label>
                <button type="submit" className="rounded-lg bg-[#0f4c36] px-5 py-2 text-sm font-medium text-white">
                  Pesquisar
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                <span>{publications.length} recurso(s) encontrado(s)</span>
                {(query || tipo) && (
                  <Link href="/biblioteca" prefetch={false} className="font-medium text-[#0f4c36] underline-offset-4 hover:underline">
                    Limpar filtros
                  </Link>
                )}
              </div>
            </section>
          )}

          {hasPublications && (
            <div className="mb-10 flex flex-wrap gap-2" role="navigation" aria-label="Filtrar por tipo">
              <Link
                href={query ? `/biblioteca?q=${encodeURIComponent(query)}` : '/biblioteca'}
                prefetch={false}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  !tipo
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/60',
                )}
                aria-current={!tipo ? 'page' : undefined}
              >
                Todos os tipos
              </Link>
              {distinctTypes.map((code) => (
                <Link
                  key={code}
                  href={`/biblioteca?tipo=${encodeURIComponent(code)}${querySuffix}`}
                  prefetch={false}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    tipo === code
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/60',
                  )}
                  aria-current={tipo === code ? 'page' : undefined}
                >
                  {typeLabels[code] || capitalizeFirstLetter(code)}
                </Link>
              ))}
            </div>
          )}

          {!hasPublications ? (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-lg text-muted-foreground">
                {layout.pages.biblioteca.emptyMessage}
              </p>
            </div>
          ) : publications.length === 0 ? (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-lg text-muted-foreground">
                Não encontrámos recursos com estes filtros. Ajuste a pesquisa ou veja todos.
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
                  <div className="relative mb-4 h-48 overflow-hidden rounded-lg">
                    <OptimizedPublicationCover
                      src={getAssetUrl(publication.coverImage)}
                      alt={publication.title}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                  <p className="mt-2 overflow-hidden text-sm leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                    {richTextToPlainText(publication.description)}
                  </p>
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

          <section className="mt-14">
            <div className="mb-6">
              <h2 className="font-display text-3xl font-bold !text-[#0f4c36]">Conteúdos de Recursos</h2>
            </div>
            <GalleryTabs items={media} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
