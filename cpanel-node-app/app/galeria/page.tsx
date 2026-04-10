import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GalleryTabs from '@/components/GalleryTabs';
import { listGalleryMedia } from '@/app/api/_lib/cms';

export const metadata: Metadata = {
  title: 'Galeria Multimédia | CEISCaramulo',
  description: 'Galeria multimédia do CEISCaramulo com fotografias, vídeos e áudios sobre a Serra do Caramulo.',
  keywords: ['galeria', 'multimédia', 'fotos', 'vídeos', 'áudios', 'CEISCaramulo', 'Serra do Caramulo'],
  openGraph: {
    title: 'Galeria Multimédia | CEISCaramulo',
    description: 'Explore fotografias, vídeos e áudios da Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt/galeria',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Galeria multimédia - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galeria Multimédia | CEISCaramulo',
    description: 'Explore fotografias, vídeos e áudios da Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/galeria',
  },
};

export default async function GaleriaPage() {
  const media = await listGalleryMedia('public');

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Galeria Multimédia
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Descobre fotografias, vídeos e áudios do património natural e cultural da Serra do Caramulo.
            </p>
          </div>

          <GalleryTabs items={media} />
        </div>
      </main>
      <Footer />
    </>
  );
}

