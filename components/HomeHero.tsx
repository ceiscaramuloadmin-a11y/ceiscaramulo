'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import SiteLogo from '@/components/SiteLogo';
import { carouselIndexAfterStep } from '@/lib/carousel-nav';
import { splitHeroImageSources } from '@/lib/hero-image-sources';
import { navBarElevatedClasses } from '@/lib/nav-scroll-accent';
import { cn } from '@/lib/utils';
import type { NavItem, SiteLayoutSettings } from '@/types';

type HeroProps = {
  hero: SiteLayoutSettings['home']['hero'];
  navigationItems: NavItem[];
};

/**
 * Barra de navegação da homepage: mantém-se visível no topo ao fazer scroll graças a `sticky`.
 * Isto replica a sensação de “navbar fixa” pedida no roadmap, sem sobrepor outras páginas que usam `<Header />`.
 */
const NAV_OUTER_CLASSES =
  'sticky top-0 z-50 bg-white/60 px-4 pt-4 pb-2 backdrop-blur-md transition-[box-shadow]';

/** Intervalo entre trocas de slide no carrossel (milisegundos). */
const HERO_ROTATION_MS = 5000;

export default function HomeHero({ hero, navigationItems }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const autoplayPauseUntilRef = useRef(0);

  const heroImages = useMemo(() => splitHeroImageSources(hero.imageUrl || ''), [hero.imageUrl]);

  const pauseAutoplayMomentarily = useCallback(() => {
    autoplayPauseUntilRef.current = Date.now() + HERO_ROTATION_MS * 2;
  }, []);

  const goToRelativeSlide = useCallback(
    (delta: number) => {
      pauseAutoplayMomentarily();
      setActiveSlide((current) => carouselIndexAfterStep(current, heroImages.length, delta));
    },
    [heroImages.length, pauseAutoplayMomentarily],
  );

  const goToSlideIndex = useCallback(
    (index: number) => {
      pauseAutoplayMomentarily();
      setActiveSlide(carouselIndexAfterStep(index, heroImages.length, 0));
    },
    [heroImages.length, pauseAutoplayMomentarily],
  );

  const trimmedTitleLines = [hero.titleLine1, hero.titleLine2, hero.titleLine3, hero.titleLine4].map((line) =>
    (line || '').trim()
  );
  const heroTitlePieces = trimmedTitleLines.filter(Boolean);
  const singleLineHeroTitle = heroTitlePieces.length <= 1;

  useEffect(() => {
    if (heroImages.length <= 1 || prefersReducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      if (Date.now() < autoplayPauseUntilRef.current) {
        return;
      }
      setActiveSlide((current) => carouselIndexAfterStep(current, heroImages.length, 1));
    }, HERO_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [heroImages.length, prefersReducedMotion]);

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
    setIsMobileMenuOpen(false);
  }, [activeSlide]);

  const parallaxOffset = prefersReducedMotion ? 0 : Math.min(scrollY * 0.22, 120);

  return (
    <section
      className="relative min-h-[870px] overflow-hidden"
      aria-label={heroImages.length > 1 ? `Destaque com ${heroImages.length} imagens` : undefined}
    >
      <div className={`${navBarElevatedClasses(scrollY, 'hero')} ${NAV_OUTER_CLASSES}`}>
        <div className="mx-auto max-w-7xl rounded-full border border-white/35 bg-white/90 px-4 py-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.45)] backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="CEISCaramulo - Página inicial">
              <SiteLogo imageClassName="h-10 w-auto sm:h-12" />
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
          className={
            isMobileMenuOpen ? 'mx-auto mt-3 max-w-7xl rounded-2xl border border-white/30 bg-white/95 p-2 shadow-xl md:hidden' : 'hidden'
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
        {heroImages.map((imageUrl, index) => (
          <img
            key={`${imageUrl}-${index}`}
            src={imageUrl}
            alt={hero.imageAlt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none motion-reduce:duration-0"
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
        <h1
          className={`font-hero mt-6 text-[clamp(3.8rem,8vw,5.25rem)] font-bold leading-[0.9] text-white sm:text-[clamp(4.4rem,8vw,5.8rem)] md:text-[84px] ${
            singleLineHeroTitle ? 'max-w-[20ch]' : 'max-w-[11ch]'
          }`}
        >
          {singleLineHeroTitle ? (
            <span className="block text-[#9dc44d]">{heroTitlePieces[0] || hero.titleLine1}</span>
          ) : (
            <>
              <span className="block">{hero.titleLine1}</span>
              <span className="block text-[#9dc44d]">{hero.titleLine2}</span>
              <span className="block">{hero.titleLine3}</span>
              <span className="block">{hero.titleLine4}</span>
            </>
          )}
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">{hero.description}</p>

        {heroImages.length > 1 && (
          <div className="mt-10 flex flex-col items-center gap-4" role="group" aria-label="Controlo do carrossel">
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => goToRelativeSlide(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-md backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>

              <div className="flex flex-wrap justify-center gap-2">
                {heroImages.map((_, index) => (
                  <button
                    key={`hero-dot-${index}`}
                    type="button"
                    onClick={() => goToSlideIndex(index)}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                      activeSlide === index ? 'bg-white shadow' : 'bg-white/45 hover:bg-white/75',
                    )}
                    aria-label={`Mostrar imagem ${index + 1} de ${heroImages.length}`}
                    aria-current={activeSlide === index ? 'true' : undefined}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToRelativeSlide(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-md backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Imagem seguinte"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
