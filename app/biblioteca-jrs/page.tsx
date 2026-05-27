import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Biblioteca JRS | CEISCaramulo',
  description: 'Página dedicada à Biblioteca JRS do CEISCaramulo.',
  alternates: {
    canonical: '/biblioteca-jrs',
  },
};

export default function BibliotecaJrsPage() {
  return (
    <InstitutionalProgrammePage
      title="Biblioteca JRS"
      description="Espaço de consulta e valorização documental integrado no trabalho de estudo e interpretação da Serra do Caramulo."
    />
  );
}
