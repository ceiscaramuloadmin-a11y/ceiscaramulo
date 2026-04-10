import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { usePublicActivities } from '../hooks/useCmsContent';
import type { ActivityCategory } from '../types';

const categories: { value: ActivityCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'caminhada', label: 'Caminhadas' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'palestra', label: 'Palestras' },
  { value: 'evento', label: 'Eventos' },
  { value: 'formacao', label: 'Formação' },
];

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const Atividades: React.FC = () => {
  const { data: activities = [], isLoading } = usePublicActivities();
  const [activeFilter, setActiveFilter] = useState<ActivityCategory | 'all'>('all');
  const filteredActivities = activeFilter === 'all' ? activities : activities.filter((item) => item.category === activeFilter);

  return (
    <>
      <SEOHead title="Atividades — CEISCaramulo" description="Descubra caminhadas, workshops, palestras e eventos do CEISCaramulo." keywords="atividades, caminhadas, workshops, eventos, Serra do Caramulo" />
      <div className="bg-[#f9faf7]">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Agenda viva</p>
            <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">Atividades para conhecer a serra em movimento.</h1>
          </div>
          <div className="self-end pb-2 lg:col-span-5">
            <p className="text-base leading-[1.7] text-[#43483f]">Da interpretação ambiental às experiências participativas, cada atividade aproxima pessoas, território e conhecimento.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button key={category.value} type="button" className={activeFilter === category.value ? 'rounded-full bg-[#27441d] px-5 py-2 text-sm font-medium text-white' : 'rounded-full border border-stone-300 bg-white px-5 py-2 text-sm text-stone-600 transition-colors hover:border-[#3e5c32] hover:text-[#3e5c32]'} onClick={() => setActiveFilter(category.value)}>
                {category.label}
              </button>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {isLoading ? <div className="rounded bg-white px-6 py-12 text-center text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70 lg:col-span-3">A carregar atividades...</div> : null}
            {filteredActivities.map((activity) => (
              <Link key={activity.id} to={`/atividades/${activity.id}`} className="rounded bg-white p-7 shadow-sm ring-1 ring-stone-200/70 transition-transform duration-300 hover:-translate-y-1">
                <span className="inline-flex rounded bg-[#f3f4f1] px-3 py-1 text-xs font-medium text-[#5f6559]">{capitalize(activity.category)}</span>
                <h2 className="mt-5 font-display text-[2rem] leading-tight text-[#27441d]">{activity.title}</h2>
                <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">{activity.description}</p>
                <div className="mt-8 space-y-3 border-t border-stone-200 pt-5 text-sm text-[#43483f]">
                  <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-[#3e5c32]" />{new Date(activity.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  {activity.location ? <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#3e5c32]" />{activity.location}</div> : null}
                </div>
              </Link>
            ))}
          </div>

          {!isLoading && filteredActivities.length === 0 ? <div className="mt-12 rounded bg-white px-6 py-12 text-center text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70">Nenhuma atividade encontrada nesta categoria.</div> : null}
        </section>
      </div>
    </>
  );
};

export default Atividades;
