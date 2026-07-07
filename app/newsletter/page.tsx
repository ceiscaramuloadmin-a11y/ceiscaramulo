import type { Metadata } from 'next';
import Link from 'next/link';
import NewsletterIntentForm from '@/components/NewsletterIntentForm';

export const metadata: Metadata = {
  title: 'Newsletter | CEISCaramulo',
  description: 'Formulário de subscrição da newsletter do CEISCaramulo.',
};

export default function NewsletterPage() {
  return (
    <main className="bg-[#f6f5f2]">
      <section className="mx-auto grid min-h-[70vh] w-full max-w-5xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <Link href="/" className="text-sm font-semibold text-[#0f4c36] underline-offset-4 hover:underline">
            Voltar ao site
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-[#0f4c36]">Newsletter CEISCaramulo</p>
          <h1 className="mt-4 font-display text-4xl text-[#0f4c36] sm:text-5xl">Receber noticias e atividades</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600">
            Deixa o teu email e indica que tipo de comunicacoes queres receber. Guardamos apenas o necessario para
            registar a tua intencao de contacto.
          </p>
        </div>

        <div className="self-start">
          <NewsletterIntentForm />
        </div>
      </section>
    </main>
  );
}
