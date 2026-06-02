import { Metadata } from 'next';
import Link from 'next/link';
import { Award, Landmark, Mail, MapPin, Phone, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';
import { contactInfo } from '@/data/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Sobre Nós | CEISCaramulo',
  description: 'Conheça a missão, a origem e os corpos sociais do CEISCaramulo - Centro de Estudos e Interpretação da Serra do Caramulo.',
  keywords: ['sobre nós', 'CEISCaramulo', 'Serra do Caramulo', 'missão', 'história', 'corpos sociais'],
  openGraph: {
    title: 'Sobre Nós | CEISCaramulo',
    description: 'Conheça a missão, a origem e os corpos sociais do CEISCaramulo - Centro de Estudos e Interpretação da Serra do Caramulo.',
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
    description: 'Conheça a missão, a origem e os corpos sociais do CEISCaramulo - Centro de Estudos e Interpretação da Serra do Caramulo.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/sobre-nos',
  },
};

const socialBodies = [
  {
    title: 'Mesa da Assembleia Geral',
    members: [
      'Presidente: Maria Nazaré Gonçalves Gouveia',
      '1.º Secretário: Rosa Maria Pereira Loureiro Soares',
      '2.º Secretário: Maria Dolores da Veiga Gonçalves',
    ],
  },
  {
    title: 'Direção',
    members: [
      'Presidente: Luís Filipe Rodrigues da Costa',
      'Vice-Presidente: Fernanda Marques Ferreira Martins',
      '1.º Vogal: Maria Celeste Bastos Monteiro',
      '2.º Vogal: Rosa Maria Marques Coimbra Fernandes',
      '3.º Vogal: Pedro Luís Silva Pereira',
    ],
  },
  {
    title: 'Conselho Fiscal',
    members: [
      'Presidente: António Augusto Ferreira',
      '1.º Vogal: António Dias',
      '2.º Vogal: Fernanda Maria Amaral Rodrigues Pereira',
    ],
  },
];

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

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Landmark className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-foreground">Quem Somos</h2>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  O CEISCaramulo é uma associação legalmente constituída, sem fins lucrativos, sediada na vila do Caramulo, no edifício do Turismo. A sua missão passa por promover o estudo e a investigação nos vários domínios ligados à Serra do Caramulo, desde o ambiente à geografia, da biologia à geologia, da história à etnografia e à gastronomia.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Este trabalho é pensado com um olhar simultaneamente científico, cultural e económico, valorizando o património material e imaterial da região e promovendo o empreendedorismo local como parte de uma estratégia de desenvolvimento sustentável.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Conhecer aquilo que distingue a Serra do Caramulo é, para o CEISCaramulo, a base para projetar o futuro e valorizar o que já existe.
                </p>
              </section>

              <section className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-foreground">Como Nasceu</h2>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  A ideia de criar o Centro de Estudos e Interpretação da Serra do Caramulo nasceu no âmbito do projeto “Conhecer o que é nosso, para preservar e valorizar”, apresentado pelo então Agrupamento de Escolas do Caramulo ao concurso promovido pela Fundação Montepio.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Esse projeto recebeu o Prémio Escolar Montepio 2011, no valor de 25 mil euros, e foi esse impulso que ajudou a transformar a visão inicial numa associação ativa e enraizada no território.
                </p>
              </section>

              <section className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Users2 className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-foreground">Fundadores</h2>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  O grupo fundador que concretizou a Associação CEISCaramulo reuniu pessoal docente e não docente, encarregados de educação da Escola EB 2,3 do Caramulo e do Agrupamento de Escolas de Tondela Tomaz Ribeiro, as freguesias do território da Serra do Caramulo representadas pelas respetivas juntas e ainda o vereador do pelouro da Cultura e Educação da Câmara Municipal de Tondela.
                </p>
              </section>
            </div>

            <div className="space-y-8">
              <section className="rounded-[28px] border border-border bg-muted p-8">
                <h2 className="font-display text-3xl font-bold text-foreground">Corpos Sociais</h2>
                <div className="mt-6 space-y-5">
                  {socialBodies.map((group) => (
                    <article key={group.title} className="rounded-2xl border border-border bg-white p-5">
                      <h3 className="font-display text-xl font-bold text-foreground">{group.title}</h3>
                      <ul className="mt-4 space-y-2">
                        {group.members.map((member) => (
                          <li key={member} className="text-sm leading-6 text-muted-foreground">
                            {member}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>

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
