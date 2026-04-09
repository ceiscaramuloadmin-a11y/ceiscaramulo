import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import SEOHead from '../components/SEOHead';
import { usePublicNews } from '../hooks/useCmsContent';
import { getAssetUrl } from '../lib/api';

const getArticleDate = (value?: string | null, fallback?: string) =>
  new Date(value || fallback || '').toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const Noticias: React.FC = () => {
  const { data: newsArticles = [], isLoading } = usePublicNews();
  const categories = ['Todas', ...Array.from(new Set(newsArticles.map((article) => article.category)))];
  const [activeCategory, setActiveCategory] = useState('Todas');
  const filteredArticles = activeCategory === 'Todas' ? newsArticles : newsArticles.filter((article) => article.category === activeCategory);
  const [featuredArticle, ...remainingArticles] = filteredArticles;

  return (
    <>
      <SEOHead title="Notícias — CEISCaramulo" description="Acompanhe as últimas novidades sobre projetos, investigação e vida associativa." keywords="notícias, projetos, investigação, Serra do Caramulo, CEISCaramulo" />
      <div className="bg-[#f9faf7]">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Atualidade</p>
            <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">Histórias, descobertas e passos concretos no território.</h1>
          </div>
          <div className="self-end pb-2 lg:col-span-5">
            <p className="text-base leading-[1.7] text-[#43483f]">Acompanhe os projetos, a investigação em curso e os momentos que marcam a vida do CEISCaramulo.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button key={category} type="button" className={activeCategory === category ? 'rounded-full bg-[#27441d] px-5 py-2 text-sm font-medium text-white' : 'rounded-full border border-stone-300 bg-white px-5 py-2 text-sm text-stone-600 transition-colors hover:border-[#3e5c32] hover:text-[#3e5c32]'} onClick={() => setActiveCategory(category)}>
                {category}
              </button>
            ))}
          </div>

          {isLoading ? <div className="mt-12 rounded bg-white p-8 text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70">A carregar notícias...</div> : null}

          {featuredArticle ? (
            <Link to={`/noticias/${featuredArticle.slug}`} className="mt-12 block overflow-hidden rounded bg-white shadow-sm ring-1 ring-stone-200/70 transition-transform duration-300 hover:-translate-y-1">
              <img src={getAssetUrl(featuredArticle.image)} alt={featuredArticle.title} className="h-72 w-full object-cover" />
              <div className="p-8">
                <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{getArticleDate(featuredArticle.publishedAt, featuredArticle.createdAt)} • {featuredArticle.category}</p>
                <h2 className="mt-5 max-w-4xl font-display text-[2.8rem] leading-[1.02] text-[#27441d]">{featuredArticle.title}</h2>
                <p className="mt-5 max-w-3xl text-base leading-[1.8] text-[#5f6559]">{featuredArticle.excerpt}</p>
                <p className="mt-6 text-sm font-medium text-[#3e5c32]">Por {featuredArticle.author}</p>
              </div>
            </Link>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {remainingArticles.map((article) => (
              <Link key={article.id} to={`/noticias/${article.slug}`} className="overflow-hidden rounded bg-white shadow-sm ring-1 ring-stone-200/70 transition-transform duration-300 hover:-translate-y-1">
                <img src={getAssetUrl(article.image)} alt={article.title} className="h-56 w-full object-cover" />
                <div className="p-8">
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{getArticleDate(article.publishedAt, article.createdAt)} • {article.category}</p>
                  <h2 className="mt-5 font-display text-[2rem] leading-[1.08] text-[#27441d]">{article.title}</h2>
                  <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">{article.excerpt}</p>
                  <p className="mt-6 text-sm font-medium text-[#3e5c32]">Por {article.author}</p>
                </div>
              </Link>
            ))}
          </div>

          {!isLoading && filteredArticles.length === 0 ? <div className="mt-8 rounded bg-white p-8 text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70">Não existem notícias disponíveis nesta categoria.</div> : null}
        </section>
      </div>
    </>
  );
};

export default Noticias;
