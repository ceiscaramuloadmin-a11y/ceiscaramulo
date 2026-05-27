import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Oficina do Burel | CEISCaramulo',
  description: 'Página dedicada à Oficina do Burel do CEISCaramulo.',
  alternates: {
    canonical: '/oficina-do-burel',
  },
};

export default function OficinaDoBurelPage() {
  return (
    <InstitutionalProgrammePage
      title="Oficina do Burel"
      description="Espaço dedicado à valorização do burel, dos saberes tradicionais e das práticas ligadas à identidade da Serra do Caramulo."
    />
  );
}
