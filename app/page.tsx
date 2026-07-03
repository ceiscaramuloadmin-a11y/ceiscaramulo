import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CoverImage from '@/components/CoverImage';
import Footer from '@/components/Footer';
import HomeHero from '@/components/HomeHero';
import MotionReveal from '@/components/MotionReveal';
import { activities as fallbackActivities, newsArticles as fallbackNewsArticles } from '@/data/content';
import { navigationItems } from '@/data/navigation';
import { withPublicContentAsset } from '@/lib/public-content-assets';
import { richTextToPlainText } from '@/lib/richText';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import prisma from '@/lib/prisma';
import { getAssetUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

function hasFindMany(delegate: unknown): delegate is {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
} {
  return !!delegate && typeof (delegate as { findMany?: unknown }).findMany === 'function';
}

async function getPublicNews() {
  if (!hasFindMany(prisma.news)) {
    return fallbackNewsArticles.slice(0, 3).map((article) => ({
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

  try {
    const news = await prisma.news.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    });
    return news.map((article) => withPublicContentAsset('news', article));
  } catch (error) {
    console.error('Error fetching news:', error);
    return fallbackNewsArticles.slice(0, 3).map((article) => ({
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
  if (!hasFindMany(prisma.activity)) {
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

  try {
    const activities = await prisma.activity.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    });
    return activities.map((activity) => withPublicContentAsset('activities', activity));
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

export default async function HomePage() {
  const newsArticles = await getPublicNews();
  const activities = await getPublicActivities();
  const layout = await getPublicSiteLayoutSettings();
  const hero = {
    ...layout.home.hero,
    imageUrl: '/hero-imgs/hero-img.webp',
  };

  return (
    <div className="bg-white text-foreground">
      <HomeHero hero={hero} navigationItems={navigationItems} />

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
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

          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(220px,300px))] justify-center gap-5">
            {activities.map((activity, index) => (
              <MotionReveal key={activity.id} className="h-full" delayMs={index * 90}>
              <Link
                href={`/atividades/${activity.id}`}
                className="group flex h-full flex-col rounded-lg border border-[#f1f3f5] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-30px_rgba(0,0,0,0.35)]"
              >
                <div className="mb-3 aspect-[4/3] overflow-hidden rounded-md bg-[#f4f5f7]">
                    <CoverImage
                      src={getAssetUrl(activity.image)}
                      alt={activity.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                </div>
                <span className="inline-flex rounded-md bg-[#f4f5f7] px-2 py-1 text-[10px] font-medium text-[#666]">
                  {capitalize(activity.category)}
                </span>
                <h3 className="mt-3 overflow-hidden font-display text-xl font-bold leading-tight text-[#1a1a1a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {activity.title}
                </h3>
                <p className="mt-2 overflow-hidden text-sm leading-[1.55] text-[#666] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                  {richTextToPlainText(activity.description)}
                </p>
                <p className="mt-auto pt-4 text-[11px] text-[#8a8a8a]">
                  {activity.location} • {formatShortDate(activity.date)}
                </p>
              </Link>
              </MotionReveal>
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

          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(240px,320px))] justify-center gap-5">
            {newsArticles.map((article, index) => (
              <MotionReveal key={article.id} className="h-full" delayMs={index * 110}>
              <Link
                href={`/noticias/${article.slug}`}
                className="group flex h-full flex-col rounded-lg border border-[#f1f3f5] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-30px_rgba(0,0,0,0.35)]"
              >
                <div className="mb-3 aspect-[4/3] overflow-hidden rounded-md bg-[#f4f5f7]">
                    <CoverImage
                      src={getAssetUrl(article.image)}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#888]">
                  {formatLongDate(article.publishedAt || article.createdAt || '')} • {article.category}
                </p>
                <h3 className="mt-3 overflow-hidden font-display text-xl font-bold leading-tight text-[#1a1a1a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {article.title}
                </h3>
                <p className="mt-2 overflow-hidden text-sm leading-[1.55] text-[#666] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                  {richTextToPlainText(article.excerpt)}
                </p>
              </Link>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
