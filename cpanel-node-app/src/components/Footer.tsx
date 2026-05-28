import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { contactInfo } from '../data/site';

const footerColumns = [
  {
    title: 'Institucional',
    links: [
      { label: 'Sobre Nós', href: '/sobre-nos' },
      { label: 'Atividades', href: '/atividades' },
      { label: 'Projetos', href: '/projetos' },
      { label: 'Biblioteca', href: '/biblioteca' },
    ],
  },
  {
    title: 'Comunidade',
    links: [
      { label: 'Notícias', href: '/noticias' },
      { label: 'A Serra', href: '/serra-do-caramulo' },
      { label: 'Contactos', href: '/contactos' },
    ],
  },
];

const socialLinks = [
  { label: 'Instagram', href: contactInfo.socialMedia.instagram },
  { label: 'Facebook', href: contactInfo.socialMedia.facebook },
  { label: 'YouTube', href: contactInfo.socialMedia.youtube },
].filter((item): item is { label: string; href: string } => Boolean(item.href));

const Footer: React.FC = () => {
  const location = useLocation();

  return (
    <footer className="border-t border-stone-200/60 bg-[#f5f5f4]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-4">
            <Link to="/" className="font-display text-[1.7rem] text-[#3e5c32]">
              CEISCaramulo
            </Link>
            <p className="max-w-xs text-sm leading-[1.7] text-stone-500">
              promover o estudo e a investigação nos vários domínios e interesses, designadamente ambiental, geográfico, biológico, geológico, histórico, etnográfico, gastronómico, ..., da Serra do Caramulo
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-bold text-[#3e5c32]">{column.title}</h3>
              <div className="mt-6 grid gap-4">
                {column.links.map((item) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={isActive ? 'text-sm font-semibold text-[#3e5c32] underline' : 'text-sm text-stone-500 underline-offset-4 transition-colors hover:text-[#3e5c32] hover:underline'}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-bold text-[#3e5c32]">Redes Sociais</h3>
            <div className="mt-6 grid gap-4">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-stone-500 underline-offset-4 transition-colors hover:text-[#3e5c32] hover:underline"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200/80">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-stone-500 sm:px-6 lg:px-8">
          © CEISCaramulo - Organização sem fins lucrativos. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
