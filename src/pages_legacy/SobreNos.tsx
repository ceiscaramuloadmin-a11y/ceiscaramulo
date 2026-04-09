import React from 'react';
import { Eye, Heart, Target, Users } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { teamMembers } from '../data/content';

const pillars = [
  { icon: Target, title: 'Missão', text: 'Promover o estudo científico, a preservação ambiental e a valorização cultural da Serra do Caramulo com trabalho de proximidade e continuidade.' },
  { icon: Eye, title: 'Visão', text: 'Ser uma referência nacional na interpretação de territórios de montanha, ligando investigação, educação e comunidade.' },
  { icon: Heart, title: 'Valores', text: 'Rigor, cuidado com o território, colaboração intergeracional e compromisso com um desenvolvimento sustentável.' },
];

const SobreNos: React.FC = () => (
  <>
    <SEOHead title="Sobre Nós — CEISCaramulo" description="Conheça o CEISCaramulo, a sua missão, visão, valores e equipa." keywords="CEISCaramulo, sobre nós, missão, equipa, associação" />
    <div className="bg-[#f9faf7]">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Quem somos</p>
          <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">Um centro dedicado a estudar, preservar e partilhar a Serra do Caramulo.</h1>
        </div>
        <div className="self-end pb-2 lg:col-span-5">
          <p className="text-base leading-[1.7] text-[#43483f]">O CEISCaramulo nasceu para transformar conhecimento em ação. Trabalhamos com investigadores, escolas, habitantes e visitantes para proteger o património natural, cultural e histórico da serra.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 sm:px-6 lg:grid-cols-3 lg:px-8">
        {pillars.map((item) => (
          <article key={item.title} className="rounded bg-white p-8 shadow-sm ring-1 ring-stone-200/70">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-[#f3f4f1] text-[#27441d]"><item.icon className="h-5 w-5" /></div>
            <h2 className="mt-6 font-display text-[2rem] text-[#27441d]">{item.title}</h2>
            <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">A nossa história</p>
          <h2 className="mt-4 font-display text-[2.5rem] leading-tight text-[#27441d]">Da serra para a comunidade.</h2>
        </div>
        <div className="space-y-6 lg:col-span-8">
          <p className="text-base leading-[1.85] text-[#43483f]">Fundado em 2010 por investigadores e apaixonados pela natureza, o CEISCaramulo surgiu da vontade de criar uma estrutura capaz de reunir conhecimento científico, memória local e participação cívica.</p>
          <p className="text-base leading-[1.85] text-[#43483f]">Ao longo dos anos, promovemos caminhadas interpretativas, projetos de conservação, ações educativas e parcerias com universidades, autarquias e associações da região.</p>
          <p className="text-base leading-[1.85] text-[#43483f]">Hoje, o centro continua a crescer como plataforma de encontro entre investigação, património e futuro, mantendo sempre a serra no centro de cada decisão.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Equipa</p>
            <h2 className="mt-4 font-display text-[2.5rem] text-[#27441d]">As pessoas por detrás do projeto</h2>
          </div>
          <p className="max-w-xl text-sm leading-[1.8] text-[#5f6559]">Uma equipa multidisciplinar que combina ciência, educação, comunicação e trabalho no terreno.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => (
            <article key={member.id} className="rounded bg-white p-8 shadow-sm ring-1 ring-stone-200/70">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f4f1] text-[#27441d]"><Users className="h-6 w-6" /></div>
              <h3 className="mt-6 font-display text-[1.65rem] leading-tight text-[#27441d]">{member.name}</h3>
              <p className="mt-2 text-sm font-semibold text-[#3e5c32]">{member.role}</p>
              <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">{member.bio}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  </>
);

export default SobreNos;
