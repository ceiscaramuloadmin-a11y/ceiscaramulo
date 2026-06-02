import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
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

  return (
    <InstitutionalProgrammePage
      title={layout.pages.oficinaDoBurel.title}
      description={layout.pages.oficinaDoBurel.description}
    />
  );
}
