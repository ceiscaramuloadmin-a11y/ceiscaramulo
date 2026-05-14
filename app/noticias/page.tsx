import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { newsArticles as fallbackNewsArticles } from '@/data/content';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import prisma from '@/lib/prisma';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import { formatDate, getAssetUrl } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Notícias | CEISCaramulo',
  description: 'Últimas novidades e notícias do CEISCaramulo sobre a Serra do Caramulo.',
  keywords: ['notícias', 'CEISCaramulo', 'Serra do Caramulo', 'atualidades'],
  openGraph: {
    title: 'Notícias | CEISCaramulo',
    description: 'Últimas novidades e notícias do CEISCaramulo sobre a Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt/noticias',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Notícias - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notícias | CEISCaramulo',
    description: 'Últimas novidades e notícias do CEISCaramulo sobre a Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/noticias',
  },
};

async function getPublicNews() {
  if (shouldSkipPublicDb()) {
    return fallbackNewsArticles.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      image: null,
      category: article.category,
      publishedAt: article.publishedAt ?? article.date,
      createdAt: article.date,
    }));
  }

  try {
    const news = await prisma.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });
    return news;
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('public news');
    } else {
      console.warn('Error fetching news; using fallback data.');
    }
    return fallbackNewsArticles.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      image: null,
      category: article.category,
      publishedAt: article.publishedAt ?? article.date,
      createdAt: article.date,
    }));
  }
}

export default async function NoticiasPage() {
  const newsArticles = await getPublicNews();
  const layout = await getPublicSiteLayoutSettings();

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {layout.pages.noticias.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {layout.pages.noticias.description}
            </p>
          </div>

          {newsArticles.length === 0 ? (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-lg text-muted-foreground">
                {layout.pages.noticias.emptyMessage}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {newsArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/noticias/${article.slug}`}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <img
                      src={getAssetUrl(article.image)}
                      alt={article.title}
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(article.publishedAt || article.createdAt || '')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {article.category}
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-bold leading-tight text-foreground group-hover:text-primary">
                    {article.title}
                  </h2>
                  <p className="mt-2 overflow-hidden text-sm leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Ler mais
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
