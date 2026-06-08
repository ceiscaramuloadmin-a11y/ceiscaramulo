import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
import GalleryTabs from '@/components/GalleryTabs';
import { listGalleryMedia } from '@/app/api/_lib/cms';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Escola dos Nossos Avós | CEISCaramulo',
  description: 'Página dedicada à Escola dos Nossos Avós do CEISCaramulo.',
  alternates: {
    canonical: '/escola-dos-nossos-avos',
  },
};

export default async function EscolaDosNossosAvosPage() {
  const layout = await getPublicSiteLayoutSettings();
  const media = await listGalleryMedia('public', 'escola-dos-nossos-avos');

  return (
    <InstitutionalProgrammePage
      title={layout.pages.escolaDosNossosAvos.title}
      description={layout.pages.escolaDosNossosAvos.description}
      heroImage="/internal-pages/escola-dos-nossos-avos.jpg"
    >
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold !text-[#27441d]">Conteúdos da Escola dos Nossos Avós</h2>
        </div>
        <GalleryTabs items={media} />
      </section>
    </InstitutionalProgrammePage>
  );
}
