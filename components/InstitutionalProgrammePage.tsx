import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

type InstitutionalProgrammePageProps = {
  title: string;
  description: string;
  heroImage?: string;
  children?: React.ReactNode;
};

export default function InstitutionalProgrammePage({
  title,
  description,
  heroImage,
  children,
}: InstitutionalProgrammePageProps) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#f4f6ee] pt-20">
        <section
          className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden bg-[#27441d] px-4 py-16 text-center"
          style={
            heroImage
              ? {
                  backgroundImage: `url(${heroImage})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }
              : undefined
          }
        >
          <div className="relative z-10 mx-auto max-w-4xl text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/85">
              CEISCaramulo
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl font-medium leading-relaxed text-white/90">
              {description}
            </p>
            <div className="mt-9 flex justify-center">
              <Button asChild className="rounded-full border-4 border-[#d9e4d1] bg-white px-8 text-[#27441d] hover:bg-[#eef4ec]">
                <Link href="/contactos">
                  <Mail className="mr-2 h-4 w-4" />
                  Contactar
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#27441d] transition-colors hover:text-[#3e5c32]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar a pagina inicial
          </Link>
          {children}
        </section>
      </main>
      <Footer />
    </>
  );
}
