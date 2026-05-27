import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Publicações | CEISCaramulo',
  description: 'Página dedicada às publicações do CEISCaramulo.',
  alternates: {
    canonical: '/publicacoes',
  },
};

export default function PublicacoesPage() {
  return (
    <InstitutionalProgrammePage
      title="Publicações"
      description="Área dedicada às publicações, documentos e materiais produzidos ou divulgados pelo CEISCaramulo."
    />
  );
}
