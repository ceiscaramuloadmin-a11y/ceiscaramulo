import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentComments from '@/components/ContentComments';
import { activities as fallbackActivities } from '@/data/content';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import { getActivitySlug } from '@/lib/public-content-slugs';
import prisma from '@/lib/prisma';
import { formatDate, formatShortDate, capitalizeFirstLetter, getAssetUrl } from '@/lib/utils';
import { siteConfig } from '@/data/site';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface Props {
  params: Promise<{ id: string }>;
}

async function getActivity(identifier: string) {
  if (shouldSkipPublicDb()) {
    return (
      fallbackActivities.find((activity) => activity.id === identifier || getActivitySlug(activity) === identifier) ?? null
    );
  }

  try {
    const activityById = await prisma.activity.findFirst({
      where: {
        id: identifier,
        published: true,
      },
    });

    if (activityById) {
      return activityById;
    }

    const activities = await prisma.activity.findMany({
      where: { published: true },
      orderBy: { date: 'asc' },
    });

    return activities.find((activity) => getActivitySlug(activity) === identifier) ?? null;
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('activity detail');
    } else {
      console.warn('Error fetching activity; using fallback data when available.');
    }
    return (
      fallbackActivities.find((activity) => activity.id === identifier || getActivitySlug(activity) === identifier) ?? null
    );
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity) {
    return {
      title: 'Atividade não encontrada | CEISCaramulo',
      description: 'A atividade solicitada não foi encontrada.',
    };
  }

  return {
    title: `${activity.title} | CEISCaramulo`,
    description: activity.description,
    keywords: [activity.category, 'CEISCaramulo', 'Serra do Caramulo', 'atividades'],
    openGraph: {
      title: activity.title,
      description: activity.description,
      url: `https://ceiscaramulo.pt/atividades/${getActivitySlug(activity)}`,
      siteName: 'CEISCaramulo',
      images: activity.image
        ? [
            {
              url: activity.image,
              width: 1200,
              height: 630,
              alt: activity.title,
            },
          ]
        : [
            {
              url: '/og-image.svg',
              width: 1200,
              height: 630,
              alt: activity.title,
            },
          ],
      locale: 'pt_PT',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: activity.title,
      description: activity.description,
      images: activity.image ? [activity.image] : ['/og-image.svg'],
    },
    alternates: {
      canonical: `/atividades/${getActivitySlug(activity)}`,
    },
  };
}

export default async function AtividadeDetalhePage({ params }: Props) {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: activity.title,
    description: activity.description,
    image: activity.image || '/og-image.svg',
    startDate: activity.date,
    endDate: activity.endDate || undefined,
    location: activity.location
      ? {
          '@type': 'Place',
          name: activity.location,
        }
      : undefined,
    organizer: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
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
              <Link href="/atividades" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar às Atividades
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatShortDate(activity.date)}
                {activity.endDate && ` - ${formatShortDate(activity.endDate)}`}
              </span>
              {activity.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {activity.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {capitalizeFirstLetter(activity.category)}
              </span>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {activity.title}
          </h1>

          <div className="mt-8 overflow-hidden rounded-lg">
            <img
              src={getAssetUrl(activity.image)}
              alt={activity.title}
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="mt-8 prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {activity.description}
            </p>
          </div>

          <div className="mt-12 rounded-lg bg-muted p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Detalhes da Atividade</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Data</dt>
                <dd className="mt-1 text-base font-semibold">
                  {formatDate(activity.date)}
                  {activity.endDate && ` - ${formatDate(activity.endDate)}`}
                </dd>
              </div>
              {activity.location && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Local</dt>
                  <dd className="mt-1 text-base font-semibold">{activity.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Categoria</dt>
                <dd className="mt-1 text-base font-semibold">
                  {capitalizeFirstLetter(activity.category)}
                </dd>
              </div>
            </dl>
          </div>

          <ContentComments section="activities" identifier={activity.id} title={activity.title} />
        </article>
      </main>
      <Footer />
    </>
  );
}
