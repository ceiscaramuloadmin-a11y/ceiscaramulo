'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import SiteLogo from '@/components/SiteLogo';
import { navigationItems as navItems } from '@/data/navigation';
import { navBarElevatedClasses } from '@/lib/nav-scroll-accent';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();
  const isShrunk = scrollY > 8;
  const visibleNavItems = navItems.filter(
    (item) => !['Atividades', 'Notícias', 'Contactos'].includes(item.label)
  );

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 bg-white/95 transition-[box-shadow,background-color] duration-200',
        navBarElevatedClasses(scrollY, 'global'),
        pathname !== '/' && 'border-b border-[#0f4c36]/20'
      )}
      data-shrunk={isShrunk ? 'true' : 'false'}
    >
      <a href="#main-content" className="skip-nav">
        Saltar para o conteúdo principal
      </a>

      <div
        className={cn(
          'mx-auto flex w-full max-w-[96rem] items-center justify-between gap-3 px-4 transition-[height] duration-200 sm:px-6 lg:px-8',
          isShrunk ? 'h-16' : 'h-24'
        )}
      >
        <Link
          href="/"
          className="inline-flex items-center"
          aria-label="CEISCaramulo - Página inicial"
        >
          <SiteLogo imageClassName={cn('w-auto transition-[height] duration-200', isShrunk ? 'h-10 sm:h-11' : 'h-14 sm:h-16')} />
        </Link>

        <nav className="hidden min-w-0 items-center xl:flex" aria-label="Navegação principal">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const activeLinkClass = isActive
              ? pathname === '/'
                ? 'font-medium text-[#0f4c36]'
                : 'font-medium text-stone-800 underline decoration-[#0f4c36] decoration-1 underline-offset-4'
              : undefined;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap px-1.5 text-[11px] text-stone-600 transition-colors hover:text-[#0f4c36] 2xl:px-2 2xl:text-xs',
                  activeLinkClass
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-700 xl:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="global-mobile-menu"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div
        id="global-mobile-menu"
        className={cn(
          'grid overflow-hidden bg-white/95 transition-all duration-300 xl:hidden',
          isMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0">
          <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-4 sm:px-6" aria-label="Menu móvel">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;

              const activeMobileClass = isActive
              ? pathname === '/'
                ? 'bg-[#f3f4f1] font-medium text-[#0f4c36]'
                : 'bg-[#f3f4f1] font-medium text-stone-800 underline decoration-[#0f4c36] decoration-1 underline-offset-4'
              : 'text-stone-600 hover:bg-stone-50';

            return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-4 py-3 text-sm transition-colors',
                    activeMobileClass
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
