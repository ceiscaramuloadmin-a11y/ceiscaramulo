import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  ChevronRight,
  Facebook,
  FolderOpen,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Mountain,
  Newspaper,
  Phone,
  TreePine,
  Users,
  X,
  Youtube,
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { Button } from '../components/ui/button';
import heroImage from '../assets/hero-serra.jpg';
import { navigationItems } from '../data/navigation';
import { usePublicActivities, usePublicNews } from '../hooks/useCmsContent';
import { contactInfo, siteConfig } from '../data/site';
import { cn } from '../lib/utils';

const sectionLinks = [
  { icon: Users, title: 'Sobre Nós', description: 'Conheça a nossa missão e equipa', href: '/sobre-nos' },
  { icon: Calendar, title: 'Atividades', description: 'Caminhadas, workshops e eventos', href: '/atividades' },
  { icon: Newspaper, title: 'Notícias', description: 'Últimas novidades da associação', href: '/noticias' },
  { icon: FolderOpen, title: 'Projetos', description: 'Investigação e conservação', href: '/projetos' },
  { icon: BookOpen, title: 'Biblioteca', description: 'Publicações e documentos', href: '/biblioteca' },
  { icon: Mountain, title: 'A Serra', description: 'Flora, fauna e geologia', href: '/serra-do-caramulo' },
  { icon: Camera, title: 'Galeria', description: 'Fotografias e vídeos', href: '/galeria' },
] as const;

const footerPrimaryLinks = navigationItems.slice(0, 4);
const footerExploreLinks = [
  { label: 'Biblioteca', href: '/biblioteca' },
  { label: 'A Serra do Caramulo', href: '/serra-do-caramulo' },
  { label: 'Galeria Multimédia', href: '/galeria' },
  { label: 'Contactos', href: '/contactos' },
];

const formatLongDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const FloatingNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="absolute inset-x-0 top-6 z-20 px-4">
      <div className="mx-auto max-w-5xl rounded-full border border-white/40 bg-white/90 px-4 py-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.45)] backdrop-blur md:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-foreground" aria-label="CEISCaramulo - Página inicial">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TreePine className="h-4 w-4" />
            </span>
            <span className="leading-none">
              <span className="block text-sm font-bold tracking-[-0.02em]">CEISCaramulo</span>
              <span className="block pt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                Serra do Caramulo
              </span>
            </span>
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-foreground md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="homepage-menu"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegação principal da homepage">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div
          id="homepage-menu"
          className={cn(
            'grid overflow-hidden transition-all duration-300 md:hidden',
            isMenuOpen ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="min-h-0">
            <nav className="grid gap-1 rounded-[28px] border border-border/70 bg-white p-3" aria-label="Menu móvel da homepage">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { data: newsArticles = [] } = usePublicNews();
  const { data: activities = [] } = usePublicActivities();

  return (
    <>
      <SEOHead />

      <div className="bg-white text-foreground">
        <section className="relative min-h-[870px] overflow-hidden">
          <FloatingNav />

          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Vista panorâmica da Serra do Caramulo"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,18,0.18)_0%,rgba(8,13,22,0.42)_52%,rgba(255,255,255,0)_82%,#ffffff_100%)]" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[870px] max-w-5xl flex-col items-center justify-center px-4 pb-24 pt-32 text-center sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/80">
              Associação sem fins lucrativos
            </p>

            <h1 className="mt-6 max-w-[750px] font-display text-5xl font-bold leading-[0.92] text-white sm:text-6xl md:text-[84px]">
              <span className="block">Centro de Estudos e</span>
              <span className="block text-[#9dc44d]">Interpretação</span>
              <span className="block">da Serra</span>
              <span className="block">do Caramulo</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Preservar, estudar e divulgar o património natural, cultural e histórico da Serra do Caramulo.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-md bg-primary px-8 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(58,90,42,0.8)] hover:bg-primary/95"
              >
                <Link to="/sobre-nos">Conhecer a Associação</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-md border-white/45 bg-white/18 px-8 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
              >
                <Link to="/atividades">Ver Atividades</Link>
              </Button>
            </div>

            <a
              href="#explore"
              className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center justify-center text-white/60 transition-colors hover:text-white"
              aria-label="Descer para explorar a homepage"
            >
              <ArrowDown className="h-6 w-6" />
            </a>
          </div>
        </section>

        <section id="explore" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Explore</p>
              <h2 className="mt-2 font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
                Descubra o CEISCaramulo
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-6 text-[#666]">
                Uma associação dedicada à preservação e estudo do património único da Serra do Caramulo.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sectionLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group flex min-h-[102px] items-start gap-5 rounded-xl border border-[#f3f4f6] bg-[rgba(248,249,250,0.35)] px-6 py-[25px] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-[#1a1a1a]">{item.title}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a] transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[#666]">{item.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8f9fa] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Últimas</p>
                <h2 className="mt-2 font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
                  Notícias
                </h2>
              </div>
              <Link
                to="/noticias"
                className="inline-flex items-center gap-1 text-sm text-[#666] transition-colors hover:text-primary"
              >
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {newsArticles.slice(0, 2).map((article) => (
                <Link
                  key={article.id}
                  to={`/noticias/${article.slug}`}
                  className="rounded-xl border border-[#f1f3f5] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-34px_rgba(0,0,0,0.3)]"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#888]">
                    {formatLongDate(article.publishedAt || article.createdAt || '')} • {article.category}
                  </p>
                  <h3 className="mt-6 font-display text-[2rem] font-bold leading-[1.04] text-[#1a1a1a]">
                    {article.title}
                  </h3>
                  <p className="mt-6 max-w-[34rem] text-sm leading-[1.65] text-[#666]">
                    {article.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Próximas</p>
                <h2 className="mt-2 font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
                  Atividades
                </h2>
              </div>
              <Link
                to="/atividades"
                className="inline-flex items-center gap-1 text-sm text-[#666] transition-colors hover:text-primary"
              >
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {activities.slice(0, 3).map((activity) => (
                <Link
                  key={activity.id}
                  to={`/atividades/${activity.id}`}
                  className="rounded-xl border border-[#f1f3f5] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-34px_rgba(0,0,0,0.3)]"
                >
                  <span className="inline-flex rounded-md bg-[#f4f5f7] px-2 py-1 text-[10px] font-medium text-[#666]">
                    {capitalize(activity.category)}
                  </span>
                  <h3 className="mt-4 font-display text-[1.75rem] font-bold leading-[1.12] text-[#1a1a1a]">
                    {activity.title}
                  </h3>
                  <p className="mt-4 text-sm leading-[1.65] text-[#666]">{activity.description}</p>
                  <p className="mt-6 text-[11px] text-[#8a8a8a]">
                    {activity.location} • {formatShortDate(activity.date)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 pt-4 sm:px-6">
          <div className="mx-auto max-w-[1024px] rounded-[20px] bg-[#f4f5f7] px-6 py-16 text-center sm:px-12">
            <h2 className="font-display text-[2.25rem] font-bold leading-tight text-[#1a1a1a]">
              Junte-se a nós
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#666]">
              Faça parte de uma comunidade dedicada à preservação do património da Serra do Caramulo.
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-md bg-primary px-8 text-sm font-semibold text-white hover:bg-primary/95"
            >
              <Link to="/contactos">Entrar em contacto</Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-[#f3f4f6] bg-white px-4 pb-8 pt-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 pb-16 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-6">
                <Link to="/" className="flex items-center gap-3 text-foreground" aria-label="CEISCaramulo - Página inicial">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <TreePine className="h-4 w-4" />
                  </span>
                  <span className="text-lg font-bold tracking-[-0.02em]">CEISCaramulo</span>
                </Link>
                <p className="max-w-[17rem] text-sm leading-[1.65] text-[#666]">{siteConfig.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">Navegação</h3>
                <div className="mt-6 grid gap-4">
                  {footerPrimaryLinks.map((item) => (
                    <Link key={item.href} to={item.href} className="text-sm text-[#666] transition-colors hover:text-primary">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">Explorar</h3>
                <div className="mt-6 grid gap-4">
                  {footerExploreLinks.map((item) => (
                    <Link key={item.href} to={item.href} className="text-sm text-[#666] transition-colors hover:text-primary">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">Contactos</h3>
                <div className="mt-6 grid gap-4 text-sm text-[#666]">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8fb339]" />
                    <p>
                      {contactInfo.address}, {contactInfo.postalCode} {contactInfo.city}
                    </p>
                  </div>
                  <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-3 transition-colors hover:text-primary">
                    <Phone className="h-4 w-4 shrink-0 text-[#8fb339]" />
                    <span>{contactInfo.phone}</span>
                  </a>
                  <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 transition-colors hover:text-primary">
                    <Mail className="h-4 w-4 shrink-0 text-[#8fb339]" />
                    <span>{contactInfo.email}</span>
                  </a>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  {contactInfo.socialMedia.facebook ? (
                    <a
                      href={contactInfo.socialMedia.facebook}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="text-[#666] transition-colors hover:text-primary"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  ) : null}
                  {contactInfo.socialMedia.instagram ? (
                    <a
                      href={contactInfo.socialMedia.instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="text-[#666] transition-colors hover:text-primary"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  ) : null}
                  {contactInfo.socialMedia.youtube ? (
                    <a
                      href={contactInfo.socialMedia.youtube}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="YouTube"
                      className="text-[#666] transition-colors hover:text-primary"
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-[#f9fafb] pt-8 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#666]">
                © {currentYear} CEISCaramulo. Todos os direitos reservados.
              </p>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#666]">
                Associação sem fins lucrativos
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
