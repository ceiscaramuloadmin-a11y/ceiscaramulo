import { Metadata } from 'next';
import GalleryTabs from '@/components/GalleryTabs';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
import { listGalleryMedia } from '@/app/api/_lib/cms';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Publicações | CEISCaramulo',
  description: 'Página dedicada às publicações do CEISCaramulo.',
  alternates: {
    canonical: '/publicacoes',
  },
};

export default async function PublicacoesPage() {
  const layout = await getPublicSiteLayoutSettings();
  const media = await listGalleryMedia('public', 'publicacoes');

  return (
    <InstitutionalProgrammePage
      title={layout.pages.publicacoes.title}
      description={layout.pages.publicacoes.description}
      heroImage="/internal-pages/publicacoes.jpg"
    >
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold text-foreground">Conteúdos de Publicações</h2>
        </div>
        <GalleryTabs items={media} />
      </section>
    </InstitutionalProgrammePage>
  );
}
