import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Oficinas de formação | CEISCaramulo',
  description: 'Página dedicada às oficinas de formação do CEISCaramulo.',
  alternates: {
    canonical: '/oficinas-de-formacao',
  },
};

export default function OficinasDeFormacaoPage() {
  return (
    <InstitutionalProgrammePage
      title="Oficinas de formação"
      description="Informação sobre oficinas, ações formativas e momentos de aprendizagem promovidos pelo CEISCaramulo."
    />
  );
}
