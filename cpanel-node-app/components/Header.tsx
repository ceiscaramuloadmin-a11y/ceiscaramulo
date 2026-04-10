'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Sobre Nós', href: '/sobre-nos' },
  { label: 'Atividades', href: '/atividades' },
  { label: 'Notícias', href: '/noticias' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Biblioteca', href: '/biblioteca' },
  { label: 'A Serra', href: '/serra-do-caramulo' },
  { label: 'Galeria', href: '/galeria' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/70 bg-[rgba(255,255,255,0.84)] backdrop-blur-md">
      <a href="#main-content" className="skip-nav">
        Saltar para o conteúdo principal
      </a>

      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-[-0.05em] text-[#3e5c32]"
          aria-label="CEISCaramulo - Página inicial"
        >
          CEISCaramulo
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="Navegação principal">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 text-sm text-stone-600 transition-colors hover:text-[#3e5c32]',
                  isActive && 'font-medium text-[#3e5c32]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/contactos"
            className={cn(
              'border-b-2 pb-1 text-sm transition-colors',
              pathname === '/contactos'
                ? 'border-[#3e5c32] text-[#3e5c32]'
                : 'border-transparent text-stone-600 hover:border-[#3e5c32]/40 hover:text-[#3e5c32]'
            )}
            aria-current={pathname === '/contactos' ? 'page' : undefined}
          >
            Contactos
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-700 lg:hidden"
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
          'grid overflow-hidden border-t border-stone-200/70 bg-white transition-all duration-300 lg:hidden',
          isMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0">
          <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-4 sm:px-6" aria-label="Menu móvel">
            {[...navItems, { label: 'Contactos', href: '/contactos' }].map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-4 py-3 text-sm transition-colors',
                    isActive ? 'bg-[#f3f4f1] font-medium text-[#3e5c32]' : 'text-stone-600 hover:bg-stone-50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
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
