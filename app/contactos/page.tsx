import type { Metadata } from 'next';
import { Mail, Phone, UserRound } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Contactos | CEISCaramulo',
  description: 'Entre em contacto com o CEISCaramulo através do formulário público ou dos contactos institucionais.',
  alternates: {
    canonical: '/contactos',
  },
};

function contactPhoneHref(phone: string) {
  const normalized = phone.replace(/\s+/g, '');
  return normalized.startsWith('+') ? normalized : `+351${normalized.replace(/\D/g, '')}`;
}

export default async function ContactosPage() {
  const layout = await getPublicSiteLayoutSettings();
  const contactPage = layout.pages.contactos;

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[linear-gradient(180deg,#f7f4ee_0%,#ffffff_26%,#f4f7f2_100%)] pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] bg-[#0f4c36] px-6 py-10 text-white shadow-xl sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">Contactos</p>
            <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{contactPage.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-emerald-50/90 sm:text-lg">
              {contactPage.description}
            </p>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="font-display text-2xl font-bold text-foreground">{contactPage.institutionalTitle}</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4 rounded-2xl bg-stone-50 p-4">
                    <UserRound className="mt-1 h-5 w-5 shrink-0 text-[#0f4c36]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{contactPage.presidentLabel}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{contactPage.presidentName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl bg-stone-50 p-4">
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-[#0f4c36]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{contactPage.phoneLabel}</p>
                      <a href={`tel:${contactPhoneHref(contactPage.phone)}`} className="mt-1 text-lg font-semibold text-foreground hover:text-primary">
                        {contactPage.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl bg-stone-50 p-4">
                    <Mail className="mt-1 h-5 w-5 shrink-0 text-[#0f4c36]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{contactPage.emailLabel}</p>
                      <a href={`mailto:${contactPage.email}`} className="mt-1 text-lg font-semibold text-foreground hover:text-primary">
                        {contactPage.email}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <ContactForm />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
