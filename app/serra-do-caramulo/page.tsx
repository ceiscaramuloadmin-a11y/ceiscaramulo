import { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const revalidate = 3600;

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
  const pdfUrl = '/api/docs/geologia-caramulo';

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
              Consulte o documento geológico da Serra do Caramulo diretamente nesta página, com leitura integrada dentro da área de conteúdo.
            </p>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Geologia do Caramulo</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Preview do ficheiro `docs/GeologiaCaramulo.pdf` integrado no conteúdo da página.
                  </p>
                </div>
              </div>
              <Link
                href={pdfUrl}
                target="_blank"
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Abrir PDF em separado
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-border bg-muted/30">
              <iframe
                title="Preview do documento GeologiaCaramulo"
                src={pdfUrl}
                className="h-[75vh] min-h-[640px] w-full bg-white"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
