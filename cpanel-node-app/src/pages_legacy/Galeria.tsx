import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { galleryItems } from '../data/content';

const Galeria: React.FC = () => {
  const categories = ['Todas', ...Array.from(new Set(galleryItems.map((item) => item.category)))];
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredItems = activeCategory === 'Todas' ? galleryItems : galleryItems.filter((item) => item.category === activeCategory);
  const selectedItem = galleryItems.find((item) => item.id === selectedId) || null;

  return (
    <>
      <SEOHead title="Galeria Multimédia — CEISCaramulo" description="Explore paisagens, flora, fauna e momentos das atividades através da galeria multimédia." keywords="galeria, multimédia, fotografia, Serra do Caramulo" />
      <div className="bg-[#f9faf7]">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Imagens e vídeos</p>
            <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">Uma galeria para ver a serra com tempo.</h1>
          </div>
          <div className="self-end pb-2 lg:col-span-5">
            <p className="text-base leading-[1.7] text-[#43483f]">Registos de paisagem, biodiversidade e atividades que ajudam a contar a experiência do território.</p>
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

          <div className="mt-12 columns-1 gap-6 md:columns-2 xl:columns-3">
            {filteredItems.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="group mb-6 block w-full overflow-hidden rounded bg-white text-left shadow-sm ring-1 ring-stone-200/70">
                <div className="flex aspect-[4/3] items-center justify-center bg-[#e2e3e0]"><Camera className="h-10 w-10 text-[#7b8176]" /></div>
                <div className="px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{item.category}</p>
                  <h2 className="mt-3 font-display text-[1.8rem] leading-tight text-[#27441d]">{item.title}</h2>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedItem ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#141814]/80 px-4 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl rounded bg-white p-6 shadow-2xl">
              <button type="button" className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-600" onClick={() => setSelectedId(null)} aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
              <div className="flex aspect-[16/9] items-center justify-center rounded bg-[#e2e3e0]"><Camera className="h-14 w-14 text-[#7b8176]" /></div>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{selectedItem.category}</p>
                <h2 className="mt-3 font-display text-[2rem] text-[#27441d]">{selectedItem.title}</h2>
                {selectedItem.description ? <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">{selectedItem.description}</p> : null}
              </div>
            </div>
            <button type="button" className="absolute inset-0 -z-10" onClick={() => setSelectedId(null)} aria-label="Fechar lightbox" />
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Galeria;
