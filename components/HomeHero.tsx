'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CSSProperties, useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import SiteLogo from '@/components/SiteLogo';
import heroImage from '@/src/assets/hero-imgs/hero-img.webp';
import heroCeis7902 from '@/src/assets/hero-imgs/hero-ceis-7902.webp';
import heroPonJueus1 from '@/src/assets/hero-imgs/hero-pon-jueus-1.webp';
import heroPonJueus2 from '@/src/assets/hero-imgs/hero-pon-jueus-2.webp';
import heroEscolaAvos1 from '@/src/assets/hero-imgs/hero-escola-avos-1.webp';
import heroEscolaAvos2 from '@/src/assets/hero-imgs/hero-escola-avos-2.webp';
import heroEscolaAvos3 from '@/src/assets/hero-imgs/hero-escola-avos-3.webp';
import { navBarElevatedClasses } from '@/lib/nav-scroll-accent';
import { cn } from '@/lib/utils';
import type { NavItem, SiteLayoutSettings } from '@/types';

type HeroProps = {
  hero: SiteLayoutSettings['home']['hero'];
  navigationItems: NavItem[];
};

/**
 * Barra de navegação da homepage: mantém-se fixa no topo durante o scroll.
 */
const NAV_OUTER_CLASSES =
  'fixed inset-x-0 top-0 z-50 bg-transparent px-4 pt-4 pb-2 transition-[box-shadow]';

const HERO_SWIPER_INTERVAL_MS = 6000;

// O carrossel reúne paisagem, espaços do CEIS e memória local para apresentar
// a diversidade do trabalho da associação logo na entrada do website.
const localHeroImages = [
  heroImage,
  heroPonJueus1,
  heroCeis7902,
  heroPonJueus2,
  heroEscolaAvos1,
  heroEscolaAvos2,
  heroEscolaAvos3,
];

export default function HomeHero({ hero, navigationItems }: HeroProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const isShrunk = scrollY > 8;

  const trimmedTitleLines = [hero.titleLine1, hero.titleLine2, hero.titleLine3, hero.titleLine4].map((line) =>
    (line || '').trim()
  );
  const heroTitlePieces = trimmedTitleLines.filter(Boolean);
  const singleLineHeroTitle = heroTitlePieces.length <= 1;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || localHeroImages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % localHeroImages.length);
    }, HERO_SWIPER_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  const parallaxOffset = prefersReducedMotion ? 0 : Math.min(scrollY * 0.22, 120);
  const activeHeroImage = localHeroImages[activeHeroIndex] ?? localHeroImages[0];

  return (
    <section className="relative min-h-[620px] overflow-hidden lg:min-h-[640px]">
      <div className={cn(NAV_OUTER_CLASSES, 'ceis-hero-nav-motion', navBarElevatedClasses(scrollY, 'hero'))} data-shrunk={isShrunk ? 'true' : 'false'}>
        <div
          className={cn(
            'mx-auto max-w-[96rem] rounded-full border border-white/35 bg-white/90 px-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.45)] transition-[padding] duration-200 md:px-10',
            isShrunk ? 'py-3' : 'py-4'
          )}
        >
          <div className="flex items-center justify-between gap-8">
            <Link
              href="/"
              className="flex items-center gap-3 text-foreground transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4c36]/35 active:filter active:brightness-95"
              aria-label="CEISCaramulo - Página inicial"
            >
              <SiteLogo imageClassName={cn('w-auto transition-[height] duration-200', isShrunk ? 'h-12 sm:h-14' : 'h-16 sm:h-20')} />
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-between gap-4 xl:flex 2xl:gap-6" aria-label="Navegação principal da homepage">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap px-2 text-[10px] font-semibold uppercase tracking-[0.03em] text-foreground transition-colors hover:text-[#0f4c36] 2xl:px-3 2xl:text-[11px] 2xl:tracking-[0.06em]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-700 xl:hidden"
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
          className={
            isMobileMenuOpen ? 'mx-auto mt-3 max-w-[96rem] rounded-2xl border border-white/30 bg-white/95 p-2 shadow-xl xl:hidden' : 'hidden'
          }
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
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden" data-testid="hero-carousel">
          <div key={activeHeroImage.src} className="ceis-hero-slide-motion absolute inset-0">
            <Image
              src={activeHeroImage}
              alt={hero.imageAlt}
              fill
              priority={activeHeroIndex === 0}
              sizes="100vw"
              className="h-full w-full object-cover"
              style={{
                transform: `translateY(${parallaxOffset}px) scale(1.08)`,
              }}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-[#0f4c36]/35" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(39,68,29,0.22)_0%,rgba(39,68,29,0.52)_54%,rgba(255,255,255,0)_84%,#ffffff_100%)]" />
      </div>

      <div className="relative z-20 mx-auto flex min-h-[620px] max-w-6xl flex-col items-center justify-center px-4 pb-12 pt-24 text-center sm:px-6 lg:min-h-[640px]">
        <h1
          className={`font-hero mt-2 text-[clamp(2.75rem,5.2vw,4.6rem)] font-bold leading-[1.02] text-white ${
            singleLineHeroTitle ? 'max-w-[24ch]' : 'max-w-[21ch]'
          }`}
        >
          {singleLineHeroTitle ? (
            <span className="ceis-hero-title-line block text-[#9dc44d]" style={{ '--motion-delay': '240ms' } as CSSProperties}>{heroTitlePieces[0] || hero.titleLine1}</span>
          ) : (
            <>
              <span className="ceis-hero-title-line block" style={{ '--motion-delay': '180ms' } as CSSProperties}>{hero.titleLine1}</span>
              <span className="ceis-hero-title-line block text-white" style={{ '--motion-delay': '300ms' } as CSSProperties}>{hero.titleLine2}</span>
              {hero.titleLine3 === 'da Serra' ? (
                <span className="ceis-hero-title-line block" style={{ '--motion-delay': '420ms' } as CSSProperties}><span className="text-white">da</span> <span className="text-[#9dc44d]">Serra</span></span>
              ) : (
                <span className="ceis-hero-title-line block text-[#9dc44d]" style={{ '--motion-delay': '420ms' } as CSSProperties}>{hero.titleLine3}</span>
              )}
              <span className="ceis-hero-title-line block text-[#9dc44d]" style={{ '--motion-delay': '540ms' } as CSSProperties}>{hero.titleLine4}</span>
            </>
          )}
        </h1>
      </div>
    </section>
  );
}
