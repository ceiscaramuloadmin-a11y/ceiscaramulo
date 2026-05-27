import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Escola dos Nossos Avós | CEISCaramulo',
  description: 'Página dedicada à Escola dos Nossos Avós do CEISCaramulo.',
  alternates: {
    canonical: '/escola-dos-nossos-avos',
  },
};

export default function EscolaDosNossosAvosPage() {
  return (
    <InstitutionalProgrammePage
      title="Escola dos Nossos Avós"
      description="Projeto dedicado à memória, à transmissão de saberes e à ligação entre gerações no território da Serra do Caramulo."
    />
  );
}
