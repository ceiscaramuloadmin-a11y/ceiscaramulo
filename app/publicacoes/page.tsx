import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
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

  return (
    <InstitutionalProgrammePage
      title={layout.pages.publicacoes.title}
      description={layout.pages.publicacoes.description}
    />
  );
}
