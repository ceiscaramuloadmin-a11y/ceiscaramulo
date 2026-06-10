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

const aboutHeroImage = '/internal-pages/sobre-nos.jpg';

export default async function SobreNosPage() {
  const layout = await getPublicSiteLayoutSettings();

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#f4f6ee] pt-20">
        <section
          className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden bg-[#27441d] px-4 py-16 text-center"
          style={{
            backgroundImage: `url(${aboutHeroImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 bg-black/45" />
          <div className="relative z-10 mx-auto max-w-4xl text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
              CEISCaramulo
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight !text-white sm:text-6xl lg:text-7xl">
              {layout.pages.sobre.title}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl font-medium leading-relaxed text-white">
              {layout.pages.sobre.description}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <section className="rounded-[28px] border border-[#d7decf] bg-white/95 p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Landmark className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold !text-[#27441d]">Quem Somos</h2>
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

              <section className="rounded-[28px] border border-[#d7decf] bg-white/95 p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold !text-[#27441d]">Como Nasceu</h2>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  A ideia de criar o Centro de Estudos e Interpretação da Serra do Caramulo nasceu no âmbito do projeto “Conhecer o que é nosso, para preservar e valorizar”, apresentado pelo então Agrupamento de Escolas do Caramulo ao concurso promovido pela Fundação Montepio.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Esse projeto recebeu o Prémio Escolar Montepio 2011, no valor de 25 mil euros, e foi esse impulso que ajudou a transformar a visão inicial numa associação ativa e enraizada no território.
                </p>
              </section>

              <section className="rounded-[28px] border border-[#d7decf] bg-white/95 p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Users2 className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold !text-[#27441d]">Fundadores</h2>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  O grupo fundador que concretizou a Associação CEISCaramulo reuniu pessoal docente e não docente, encarregados de educação da Escola EB 2,3 do Caramulo e do Agrupamento de Escolas de Tondela Tomaz Ribeiro, as freguesias do território da Serra do Caramulo representadas pelas respetivas juntas e ainda o vereador do pelouro da Cultura e Educação da Câmara Municipal de Tondela.
                </p>
              </section>
            </div>

            <div className="space-y-8">
              <section className="rounded-[28px] border border-[#d7decf] bg-[#e9efe3] p-8">
                <h2 className="font-display text-3xl font-bold !text-[#27441d]">Corpos Sociais</h2>
                <div className="mt-6 space-y-5">
                  {socialBodies.map((group) => (
                    <article key={group.title} className="rounded-2xl border border-[#d7decf] bg-white/90 p-5">
                      <h3 className="font-display text-xl font-bold !text-[#27441d]">{group.title}</h3>
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

          <div className="mt-16 rounded-[28px] bg-[#27441d] p-8 text-white shadow-xl">
            <h2 className="font-display text-3xl font-bold !text-white">Contacte-nos</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/85">
              Tem questões ou quer saber mais sobre o nosso trabalho? Entre em contacto connosco.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#d9e4d1]" />
                <div>
                  <p className="font-medium text-white">Morada</p>
                  <p className="text-sm text-white/75">
                    {contactInfo.address}, {contactInfo.postalCode} {contactInfo.city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-[#d9e4d1]" />
                <div>
                  <p className="font-medium text-white">Telefone</p>
                  <p className="text-sm text-white/75">{contactInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-[#d9e4d1]" />
                <div>
                  <p className="font-medium text-white">Email</p>
                  <p className="text-sm text-white/75">{contactInfo.email}</p>
                </div>
              </div>
            </div>
            <Button asChild className="mt-6 bg-white !text-[#27441d] hover:bg-[#eef4ec] hover:!text-[#27441d] [&_*]:!text-[#27441d]">
              <Link href="/contactos">Enviar mensagem</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
