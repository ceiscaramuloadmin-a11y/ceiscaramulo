import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
import GalleryTabs from '@/components/GalleryTabs';
import { listGalleryMedia } from '@/app/api/_lib/cms';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'PON do Jueus | CEISCaramulo',
  description: 'Página dedicada ao PON do Jueus do CEISCaramulo.',
  alternates: {
    canonical: '/pon-do-jueus',
  },
};

export default async function PonDoJueusPage() {
  const layout = await getPublicSiteLayoutSettings();
  const media = await listGalleryMedia('public', 'pon-do-jueus');

  return (
    <InstitutionalProgrammePage
      title={layout.pages.ponDoJueus.title}
      description={layout.pages.ponDoJueus.description}
      heroImage="/internal-pages/pon-do-jueus.jpg"
      heroTitleTone="green"
    >
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold !text-[#0f4c36]">Conteúdos do PON do Jueus</h2>
        </div>
        <GalleryTabs items={media} />
      </section>
    </InstitutionalProgrammePage>
  );
}
