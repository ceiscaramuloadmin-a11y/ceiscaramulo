import { Metadata } from 'next';
import GalleryTabs from '@/components/GalleryTabs';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
import { listGalleryMedia } from '@/app/api/_lib/cms';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Oficinas de formação | CEISCaramulo',
  description: 'Página dedicada às oficinas de formação do CEISCaramulo.',
  alternates: {
    canonical: '/oficinas-de-formacao',
  },
};

export default async function OficinasDeFormacaoPage() {
  const layout = await getPublicSiteLayoutSettings();
  const media = await listGalleryMedia('public', 'oficinas-de-formacao');

  return (
    <InstitutionalProgrammePage
      title={layout.pages.oficinasDeFormacao.title}
      description={layout.pages.oficinasDeFormacao.description}
    >
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold text-foreground">Conteúdos das Oficinas de formação</h2>
        </div>
        <GalleryTabs items={media} />
      </section>
    </InstitutionalProgrammePage>
  );
}
