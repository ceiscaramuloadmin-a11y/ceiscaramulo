import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Biblioteca JRS | CEISCaramulo',
  description: 'Página dedicada à Biblioteca JRS do CEISCaramulo.',
  alternates: {
    canonical: '/biblioteca-jrs',
  },
};

export default async function BibliotecaJrsPage() {
  const layout = await getPublicSiteLayoutSettings();

  return (
    <InstitutionalProgrammePage
      title={layout.pages.bibliotecaJrs.title}
      description={layout.pages.bibliotecaJrs.description}
    />
  );
}
