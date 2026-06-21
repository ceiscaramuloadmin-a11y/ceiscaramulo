import { Metadata } from 'next';
import GalleryTabs from '@/components/GalleryTabs';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
import { listGalleryMedia } from '@/app/api/_lib/cms';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Oficina do Burel | CEISCaramulo',
  description: 'Página dedicada à Oficina do Burel do CEISCaramulo.',
  alternates: {
    canonical: '/oficina-do-burel',
  },
};

export default async function OficinaDoBurelPage() {
  const layout = await getPublicSiteLayoutSettings();
  const media = await listGalleryMedia('public', 'oficina-do-burel');

  return (
    <InstitutionalProgrammePage
      title={layout.pages.oficinaDoBurel.title}
      description={layout.pages.oficinaDoBurel.description}
      heroImage="/internal-pages/oficina-do-burel.jpg"
    >
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold !text-[#0f4c36]">Conteúdos da Oficina do Burel</h2>
        </div>
        <GalleryTabs items={media} />
      </section>
    </InstitutionalProgrammePage>
  );
}
