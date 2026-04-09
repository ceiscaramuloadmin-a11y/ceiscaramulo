import React from 'react';
import { Flower2, Gem, Mountain, PawPrint } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { serraInfoSections } from '../data/content';

const sectionIcons = [Mountain, Flower2, PawPrint, Gem];

const SerraDoCaramulo: React.FC = () => (
  <>
    <SEOHead title="A Serra do Caramulo — CEISCaramulo" description="Descubra a geografia, flora, fauna e geologia da Serra do Caramulo." keywords="Serra do Caramulo, flora, fauna, geologia, geografia" />
    <div className="bg-[#f9faf7]">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Território</p>
          <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">A Serra do Caramulo como paisagem, laboratório e memória viva.</h1>
        </div>
        <div className="self-end pb-2 lg:col-span-5">
          <p className="text-base leading-[1.7] text-[#43483f]">Entre granitos, florestas, linhas de água e aldeias, a serra reúne ecossistemas, patrimónios e modos de vida que merecem ser conhecidos com profundidade.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8">
        {serraInfoSections.map((section, index) => {
          const Icon = sectionIcons[index] || Mountain;

          return (
            <article key={section.title} className="rounded bg-white p-8 shadow-sm ring-1 ring-stone-200/70">
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded bg-[#f3f4f1] text-[#27441d]"><Icon className="h-6 w-6" /></div>
                  <h2 className="mt-6 font-display text-[2.2rem] text-[#27441d]">{section.title}</h2>
                </div>
                <div className="lg:col-span-8">
                  <p className="text-base leading-[1.8] text-[#43483f]">{section.description}</p>
                  {section.items?.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{section.items.map((item) => <div key={item} className="rounded border border-stone-200 bg-[#fbfcf9] px-4 py-4 text-sm text-[#5f6559]">{item}</div>)}</div> : null}
                </div>
              </div>
            </article>
          );
        })}

        <div className="rounded bg-[#e2e3e0] px-8 py-20 text-center shadow-sm ring-1 ring-stone-200/70">
          <Mountain className="mx-auto h-12 w-12 text-[#5f6559]" />
          <h2 className="mt-6 font-display text-[2rem] text-[#27441d]">Localização</h2>
          <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">A Serra do Caramulo estende-se entre os distritos de Viseu e Aveiro, com o Caramulinho como ponto mais alto.</p>
          <p className="mt-2 text-sm font-medium text-[#3e5c32]">40.5731° N, 8.1683° W</p>
        </div>
      </section>
    </div>
  </>
);

export default SerraDoCaramulo;
