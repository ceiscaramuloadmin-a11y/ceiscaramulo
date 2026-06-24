import { Metadata } from 'next';
import GalleryTabs from '@/components/GalleryTabs';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
import { listGalleryMedia } from '@/app/api/_lib/cms';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import salesHeroImage from '@/src/assets/hero-imgs/hero-oficina-burel-sapatos.jpg';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Artigos para venda | CEISCaramulo',
  description: 'Página dedicada aos artigos para venda associados ao CEISCaramulo e à Serra do Caramulo.',
  alternates: {
    canonical: '/artigos-para-venda',
  },
};

export default async function ArtigosParaVendaPage() {
  const layout = await getPublicSiteLayoutSettings();
  const media = await listGalleryMedia('public', 'artigos-para-venda');

  return (
    <InstitutionalProgrammePage
      title={layout.pages.artigosParaVenda.title}
      description={layout.pages.artigosParaVenda.description}
      heroImage={salesHeroImage.src}
    >
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold !text-[#0f4c36]">Amostra de artigos para venda</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">
            Consulta fotografias, vídeos ou documentos publicados pelo backoffice para apresentar artigos disponíveis.
          </p>
        </div>
        <GalleryTabs items={media} />
      </section>
    </InstitutionalProgrammePage>
  );
}
