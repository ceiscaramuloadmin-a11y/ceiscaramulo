import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

type InstitutionalProgrammePageProps = {
  title: string;
  description: string;
};

export default function InstitutionalProgrammePage({
  title,
  description,
}: InstitutionalProgrammePageProps) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-[#3e5c32]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à página inicial
          </Link>

          <div className="mt-10 rounded-[28px] border border-border bg-card p-8 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              CEISCaramulo
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contactos">
                  <Mail className="mr-2 h-4 w-4" />
                  Contactar o CEISCaramulo
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/biblioteca">Consultar biblioteca</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
