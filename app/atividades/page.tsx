import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { activities as fallbackActivities } from '@/data/content';
import { getActivitySlug } from '@/lib/public-content-slugs';
import { withPublicContentAsset } from '@/lib/public-content-assets';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import prisma from '@/lib/prisma';
import { richTextToPlainText } from '@/lib/richText';
import ActivitiesMonthCalendar from '@/components/activities/ActivitiesMonthCalendar';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import { formatShortDate, capitalizeFirstLetter, getAssetUrl } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Atividades | CEISCaramulo',
  description: 'Caminhadas, workshops, palestras e eventos organizados pelo CEISCaramulo na Serra do Caramulo.',
  keywords: ['atividades', 'CEISCaramulo', 'Serra do Caramulo', 'caminhadas', 'workshops', 'eventos'],
  openGraph: {
    title: 'Atividades | CEISCaramulo',
    description: 'Caminhadas, workshops, palestras e eventos organizados pelo CEISCaramulo na Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt/atividades',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Atividades - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atividades | CEISCaramulo',
    description: 'Caminhadas, workshops, palestras e eventos organizados pelo CEISCaramulo na Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/atividades',
  },
};

async function getPublicActivities() {
  if (shouldSkipPublicDb()) {
    return fallbackActivities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      endDate: null,
      location: activity.location,
      image: null,
      category: activity.category,
    }));
  }

  try {
    const activities = await prisma.activity.findMany({
      where: { published: true },
      orderBy: { date: 'asc' },
    });
    return activities.map((activity) => withPublicContentAsset('activities', activity));
  } catch (error) {
    if (isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('public activities');
    } else {
      console.warn('Error fetching activities; using fallback data.');
    }
    return fallbackActivities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      endDate: null,
      location: activity.location,
      image: null,
      category: activity.category,
    }));
  }
}

export default async function AtividadesPage() {
  const activities = await getPublicActivities();
  const layout = await getPublicSiteLayoutSettings();
  const calendarEntries = activities.map((activity) => ({
    startMs: new Date(activity.date).getTime(),
    href: `/atividades/${getActivitySlug(activity)}`,
    title: activity.title,
  }));

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {layout.pages.atividades.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {layout.pages.atividades.description}
            </p>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-lg text-muted-foreground">
                {layout.pages.atividades.emptyMessage}
              </p>
            </div>
          ) : (
            <>
              <section
                aria-label="Calendário interativo de atividades"
                className="mb-14 rounded-2xl border border-border bg-card/40 p-6 shadow-sm backdrop-blur sm:p-8"
              >
                <div className="flex flex-col gap-2 pb-8 text-center sm:text-left">
                  <h2 className="font-display text-2xl font-bold leading-tight text-foreground">
                    Mapa rápido de datas
                  </h2>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    Dias com iniciativas publicadas ficam destacados. Clica para abrir a ficha quando existirem registos coincidentes.
                  </p>
                </div>
                <ActivitiesMonthCalendar entries={calendarEntries} />
              </section>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/atividades/${getActivitySlug(activity)}`}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <img
                      src={getAssetUrl(activity.image)}
                      alt={activity.title}
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
                  </div>
                  <span className="mt-2 inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {capitalizeFirstLetter(activity.category)}
                  </span>
                  <h2 className="mt-4 font-display text-xl font-bold leading-tight text-foreground group-hover:text-primary">
                    {activity.title}
                  </h2>
                  <p className="mt-2 overflow-hidden text-sm leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                    {richTextToPlainText(activity.description)}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Ver detalhes
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
