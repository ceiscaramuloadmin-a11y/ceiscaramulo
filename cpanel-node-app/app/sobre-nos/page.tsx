import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, MapPin, Phone, TreePine, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { teamMembers } from '@/data/content';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import { contactInfo, siteConfig } from '@/data/site';

export const metadata: Metadata = {
  title: 'Sobre Nós | CEISCaramulo',
  description: 'Conheça a missão, história e equipa do CEISCaramulo - Centro de Estudos e Interpretação da Serra do Caramulo.',
  keywords: ['sobre nós', 'CEISCaramulo', 'Serra do Caramulo', 'missão', 'equipa', 'história'],
  openGraph: {
    title: 'Sobre Nós | CEISCaramulo',
    description: 'Conheça a missão, história e equipa do CEISCaramulo - Centro de Estudos e Interpretação da Serra do Caramulo.',
    url: 'https://ceiscaramulo.pt/sobre-nos',
    siteName: 'CEISCaramulo',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Sobre Nós - CEISCaramulo',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre Nós | CEISCaramulo',
    description: 'Conheça a missão, história e equipa do CEISCaramulo - Centro de Estudos e Interpretação da Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/sobre-nos',
  },
};

export default async function SobreNosPage() {
  const layout = await getPublicSiteLayoutSettings();

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {layout.pages.sobre.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {layout.pages.sobre.description}
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">A Nossa Missão</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O CEISCaramulo é uma associação sem fins lucrativos dedicada ao estudo, preservação e divulgação do património natural, cultural e histórico da Serra do Caramulo.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Fundada em {siteConfig.founded}, a nossa organização trabalha incansavelmente para proteger este território único, promovendo a investigação científica, a educação ambiental e o desenvolvimento sustentável da região.
              </p>

              <div className="mt-8 rounded-lg bg-muted p-6">
                <h3 className="font-display text-xl font-bold text-foreground">Os Nossos Valores</h3>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3">
                    <TreePine className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">Preservação do património natural e cultural</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">Educação ambiental e sensibilização comunitária</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">Investigação científica e divulgação de conhecimento</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">A Nossa Equipa</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Uma equipa multidisciplinar dedicada à preservação e estudo da Serra do Caramulo.
              </p>

              <div className="mt-8 grid gap-6">
                {teamMembers.map((member) => (
                  <div key={member.id} className="rounded-lg border border-border bg-card p-6">
                    <h3 className="font-display text-xl font-bold text-foreground">{member.name}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 rounded-lg bg-muted p-8">
            <h2 className="font-display text-3xl font-bold text-foreground">Contacte-nos</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Tem questões ou quer saber mais sobre o nosso trabalho? Entre em contacto connosco.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Morada</p>
                  <p className="text-sm text-muted-foreground">
                    {contactInfo.address}, {contactInfo.postalCode} {contactInfo.city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Telefone</p>
                  <p className="text-sm text-muted-foreground">{contactInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{contactInfo.email}</p>
                </div>
              </div>
            </div>
            <Button asChild className="mt-6">
              <Link href="/contactos">Enviar mensagem</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
