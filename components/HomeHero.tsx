'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, Menu, TreePine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NavItem, SiteLayoutSettings } from '@/types';

type HeroProps = {
  hero: SiteLayoutSettings['home']['hero'];
  navigationItems: NavItem[];
};

export default function HomeHero({ hero, navigationItems }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const heroImages = useMemo(() => {
    const raw = (hero.imageUrl || '').trim();

    // IMPORTANT: data URLs contain commas, so we must never split by comma.
    // Multi-image slider supports one URL per line (or `|` as optional separator).
    const parsed = raw.includes('\n')
      ? raw.split(/\n+/).map((item) => item.trim()).filter(Boolean)
      : raw.includes('|')
        ? raw.split('|').map((item) => item.trim()).filter(Boolean)
        : raw
          ? [raw]
          : [];

    return parsed.length ? Array.from(new Set(parsed)) : ['/placeholder.svg'];
  }, [hero.imageUrl]);

  useEffect(() => {
    if (heroImages.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeSlide]);

  const parallaxOffset = Math.min(scrollY * 0.22, 120);

  return (
    <section className="relative min-h-[870px] overflow-hidden">
      <div className="absolute inset-x-0 top-6 z-30 px-4">
        <div className="mx-auto max-w-7xl rounded-full border border-white/35 bg-white/90 px-4 py-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.45)] backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="CEISCaramulo - Página inicial">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <TreePine className="h-4 w-4" />
              </span>
              <span className="leading-none">
                <span className="block text-sm font-bold tracking-[-0.02em]">CEISCaramulo</span>
                <span className="block pt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Serra do Caramulo</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-4 md:flex lg:gap-6" aria-label="Navegação principal da homepage">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-700 md:hidden"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="home-mobile-menu"
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div
          id="home-mobile-menu"
          className={isMobileMenuOpen ? 'mx-auto mt-3 max-w-7xl rounded-2xl border border-white/30 bg-white/95 p-2 shadow-xl md:hidden' : 'hidden'}
        >
          <nav className="grid gap-1" aria-label="Menu móvel da homepage">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="absolute inset-0">
        {heroImages.map((imageUrl, index) => (
          <img
            key={`${imageUrl}-${index}`}
            src={imageUrl}
            alt={hero.imageAlt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            style={{
              opacity: index === activeSlide ? 1 : 0,
              transform: `translateY(${parallaxOffset}px) scale(1.08)`,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[#27441d]/35" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(39,68,29,0.22)_0%,rgba(39,68,29,0.52)_54%,rgba(255,255,255,0)_84%,#ffffff_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[870px] max-w-5xl flex-col items-center justify-center px-4 pb-24 pt-32 text-center sm:px-6">
        <h1 className="mt-6 max-w-[750px] font-display text-5xl font-bold leading-[0.92] text-white sm:text-6xl md:text-[84px]">
          <span className="block">{hero.titleLine1}</span>
          <span className="block text-[#9dc44d]">{hero.titleLine2}</span>
          <span className="block">{hero.titleLine3}</span>
          <span className="block">{hero.titleLine4}</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">{hero.description}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-md bg-primary px-8 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(58,90,42,0.8)] hover:bg-primary/95"
          >
            <Link href={hero.primaryCtaHref}>{hero.primaryCtaLabel}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-md border-white/45 bg-white/18 px-8 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
          >
            <Link href={hero.secondaryCtaHref}>{hero.secondaryCtaLabel}</Link>
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
  );
}
