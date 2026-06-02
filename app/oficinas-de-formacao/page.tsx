import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
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

  return (
    <InstitutionalProgrammePage
      title={layout.pages.oficinasDeFormacao.title}
      description={layout.pages.oficinasDeFormacao.description}
    />
  );
}
