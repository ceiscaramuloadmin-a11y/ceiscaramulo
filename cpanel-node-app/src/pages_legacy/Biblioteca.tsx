import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { usePublicPublications } from '../hooks/useCmsContent';
import { getAssetUrl } from '../lib/api';

const typeLabels: Record<string, string> = { livro: 'Livro', artigo: 'Artigo', relatorio: 'Relatório', tese: 'Tese', documento: 'Documento' };
const typeIcons: Record<string, React.ElementType> = { livro: BookOpen, artigo: FileText, relatorio: FileText, tese: BookOpen, documento: FileText };

const Biblioteca: React.FC = () => {
  const { data: publications = [], isLoading } = usePublicPublications();
  const allTypes = ['all', ...Array.from(new Set(publications.map((item) => item.type)))];
  const [activeType, setActiveType] = useState('all');
  const filteredPublications = activeType === 'all' ? publications : publications.filter((item) => item.type === activeType);

  return (
    <>
      <SEOHead title="Biblioteca — CEISCaramulo" description="Explore livros, artigos, relatórios e outros recursos sobre a Serra do Caramulo." keywords="biblioteca, publicações, artigos, relatórios, Serra do Caramulo" />
      <div className="bg-[#f9faf7]">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Arquivo e conhecimento</p>
            <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">Biblioteca para aprofundar o olhar sobre a serra.</h1>
          </div>
          <div className="self-end pb-2 lg:col-span-5">
            <p className="text-base leading-[1.7] text-[#43483f]">Reunimos publicações, relatórios e documentos que apoiam investigação, educação e memória do território.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            {allTypes.map((type) => (
              <button key={type} type="button" className={activeType === type ? 'rounded-full bg-[#27441d] px-5 py-2 text-sm font-medium text-white' : 'rounded-full border border-stone-300 bg-white px-5 py-2 text-sm text-stone-600 transition-colors hover:border-[#3e5c32] hover:text-[#3e5c32]'} onClick={() => setActiveType(type)}>
                {type === 'all' ? 'Todos' : typeLabels[type] || type}
              </button>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {isLoading ? <div className="rounded bg-white p-8 text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70 lg:col-span-2">A carregar biblioteca...</div> : null}
            {filteredPublications.map((publication) => {
              const Icon = typeIcons[publication.type] || FileText;

              return (
                <Link key={publication.id} to={`/biblioteca/${publication.id}`} className="block rounded bg-white p-8 shadow-sm ring-1 ring-stone-200/70 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-5">
                    {publication.coverImage ? (
                      <img src={getAssetUrl(publication.coverImage)} alt={publication.title} className="h-28 w-20 shrink-0 rounded-xl object-cover ring-1 ring-stone-200" />
                    ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#f3f4f1] text-[#27441d]"><Icon className="h-5 w-5" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#f3f4f1] px-3 py-1 text-xs font-medium text-[#5f6559]">{typeLabels[publication.type]}</span>
                        <span className="text-sm text-stone-500">{publication.year}</span>
                      </div>
                      <h2 className="mt-5 font-display text-[2rem] leading-[1.08] text-[#27441d]">{publication.title}</h2>
                      <p className="mt-2 text-sm font-medium text-[#3e5c32]">{publication.author}</p>
                      <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">{publication.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {!isLoading && filteredPublications.length === 0 ? <div className="mt-12 rounded bg-white p-8 text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70">Não existem publicações disponíveis para este filtro.</div> : null}
        </section>
      </div>
    </>
  );
};

export default Biblioteca;
