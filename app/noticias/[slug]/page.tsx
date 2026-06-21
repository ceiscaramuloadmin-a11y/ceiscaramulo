import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentComments from '@/components/ContentComments';
import { newsArticles as fallbackNewsArticles } from '@/data/content';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import { publicAssetValue, withPublicContentAsset } from '@/lib/public-content-assets';
import prisma from '@/lib/prisma';
import { prepareRichTextForRender } from '@/lib/richText';
import { formatDate, getAssetUrl } from '@/lib/utils';
import { siteConfig } from '@/data/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

function toIsoString(value: string | Date | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function getNewsArticle(slug: string) {
  if (shouldSkipPublicDb()) {
    return fallbackNewsArticles.find((article) => article.slug === slug) ?? null;
  }

  try {
    const article = await prisma.news.findFirst({
      where: {
        slug,
        published: true,
      },
    });
    return article ? withPublicContentAsset('news', article) : null;
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('news detail');
      return fallbackNewsArticles.find((article) => article.slug === slug) ?? null;
    }
    console.warn('Error fetching news article; using fallback data when available.');
    return fallbackNewsArticles.find((article) => article.slug === slug) ?? null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug);

  if (!article) {
    return {
      title: 'Notícia não encontrada | CEISCaramulo',
      description: 'A notícia solicitada não foi encontrada.',
    };
  }

  return {
    title: `${article.title} | CEISCaramulo`,
    description: article.excerpt,
    keywords: [article.category, 'CEISCaramulo', 'Serra do Caramulo', 'notícias'],
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://ceiscaramulo.pt/noticias/${article.slug}`,
      siteName: 'CEISCaramulo',
      images: article.image
        ? [
            {
              url: publicAssetValue('news', article.id, article.image) || '/og-image.svg',
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : [
            {
              url: '/og-image.svg',
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ],
      locale: 'pt_PT',
      type: 'article',
      publishedTime: toIsoString(article.publishedAt),
      authors: [article.author],
      tags: [article.category],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: article.image ? [publicAssetValue('news', article.id, article.image) || '/og-image.svg'] : ['/og-image.svg'],
    },
    alternates: {
      canonical: `/noticias/${article.slug}`,
    },
  };
}

export default async function NoticiaDetalhePage({ params }: Props) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: publicAssetValue('news', article.id, article.image) || '/og-image.svg',
    datePublished: toIsoString(article.publishedAt),
    dateModified: toIsoString(article.updatedAt),
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/og-image.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/noticias/${article.slug}`,
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
              <Link href="/noticias" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar às Notícias
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(article.publishedAt || article.createdAt || '')}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {article.author}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {article.category}
              </span>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {article.title}
          </h1>

          <div className="mt-8 prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
            <div
              className="mt-6 rich-text-content"
              dangerouslySetInnerHTML={{ __html: prepareRichTextForRender(article.content, { resolveMediaUrl: getAssetUrl }) }}
            />
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <h2 className="mb-4 font-display text-2xl font-bold">Partilhe esta notícia</h2>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${siteConfig.url}/noticias/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${siteConfig.url}/noticias/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
              </Button>
            </div>
          </div>

          <ContentComments section="news" identifier={article.slug} title={article.title} />
        </article>
      </main>
      <Footer />
    </>
  );
}
