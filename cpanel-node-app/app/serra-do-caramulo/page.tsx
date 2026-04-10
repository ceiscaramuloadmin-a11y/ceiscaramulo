import { Metadata } from 'next';
import { Mountain } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { layoutIconMap } from '@/lib/layout-icons';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const metadata: Metadata = {
  title: 'A Serra do Caramulo | CEISCaramulo',
  description: 'Descubra a geografia, flora, fauna e geologia da Serra do Caramulo - um território único no centro de Portugal.',
  keywords: ['Serra do Caramulo', 'geografia', 'flora', 'fauna', 'geologia', 'CEISCaramulo'],
  openGraph: {
    title: 'A Serra do Caramulo | CEISCaramulo',
    description: 'Descubra a geografia, flora, fauna e geologia da Serra do Caramulo - um território único no centro de Portugal.',
    url: 'https://ceiscaramulo.pt/serra-do-caramulo',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'A Serra do Caramulo - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Serra do Caramulo | CEISCaramulo',
    description: 'Descubra a geografia, flora, fauna e geologia da Serra do Caramulo - um território único no centro de Portugal.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/serra-do-caramulo',
  },
};

export default async function SerraDoCaramuloPage() {
  const layout = await getPublicSiteLayoutSettings();

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {layout.pages.serra.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {layout.pages.serra.description}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {layout.serra.sections.map((section) => {
              const Icon = layoutIconMap[section.icon] || Mountain;

              return (
                <div key={section.id} className="rounded-xl border border-border bg-card p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {section.description}
                  </p>
                  {section.items && section.items.length > 0 && (
                    <ul className="mt-6 space-y-2">
                      {section.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-16 rounded-lg bg-muted p-8">
            <h2 className="font-display text-3xl font-bold text-foreground">{layout.serra.aboutTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {layout.serra.aboutParagraph1}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {layout.serra.aboutParagraph2}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
