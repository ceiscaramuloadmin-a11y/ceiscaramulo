'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import SiteLogo from '@/components/SiteLogo';
import heroImage from '@/src/assets/hero-imgs/hero-img.webp';
import heroImage2 from '@/src/assets/hero-imgs/hero-img2.webp';
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

const localHeroImages = [heroImage, heroImage2];

export default function HomeHero({ hero, navigationItems }: HeroProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
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

  const parallaxOffset = prefersReducedMotion ? 0 : Math.min(scrollY * 0.22, 120);

  return (
    <section className="relative min-h-[870px] overflow-hidden">
      <div className={cn(NAV_OUTER_CLASSES, navBarElevatedClasses(scrollY, 'hero'))} data-shrunk={isShrunk ? 'true' : 'false'}>
        <div
          className={cn(
            'mx-auto max-w-7xl rounded-full border border-white/35 bg-white/90 px-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.45)] transition-[padding] duration-200 md:px-8',
            isShrunk ? 'py-2' : 'py-3'
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="CEISCaramulo - Página inicial">
              <SiteLogo imageClassName={cn('w-auto transition-[height] duration-200', isShrunk ? 'h-8 sm:h-9' : 'h-10 sm:h-12')} />
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
        <Swiper
          modules={[Autoplay, EffectFade]}
          className="absolute inset-0 z-0 h-full w-full"
          slidesPerView={1}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={localHeroImages.length > 1}
          allowTouchMove={false}
          autoplay={
            !prefersReducedMotion && localHeroImages.length > 1
              ? { delay: HERO_SWIPER_INTERVAL_MS, disableOnInteraction: false }
              : false
          }
        >
          {localHeroImages.map((imageSrc, index) => (
            <SwiperSlide key={`${imageSrc.src}-${index}`} className="h-full w-full">
              <Image
                src={imageSrc}
                alt={hero.imageAlt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="h-full w-full object-cover"
                style={{
                  transform: `translateY(${parallaxOffset}px) scale(1.08)`,
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="pointer-events-none absolute inset-0 z-10 bg-[#27441d]/35" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(39,68,29,0.22)_0%,rgba(39,68,29,0.52)_54%,rgba(255,255,255,0)_84%,#ffffff_100%)]" />
      </div>

      <div className="relative z-20 mx-auto flex min-h-[870px] max-w-5xl flex-col items-center justify-center px-4 pb-24 pt-32 text-center sm:px-6">
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
      </div>
    </section>
  );
}
