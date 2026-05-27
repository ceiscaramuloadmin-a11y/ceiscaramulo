import { Metadata } from 'next';
import InstitutionalProgrammePage from '@/components/InstitutionalProgrammePage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'PON do Jueus | CEISCaramulo',
  description: 'Página dedicada ao PON do Jueus do CEISCaramulo.',
  alternates: {
    canonical: '/pon-do-jueus',
  },
};

export default function PonDoJueusPage() {
  return (
    <InstitutionalProgrammePage
      title="PON do Jueus"
      description="Área de apresentação do PON do Jueus e das iniciativas associadas ao trabalho cultural e educativo do CEISCaramulo."
    />
  );
}
