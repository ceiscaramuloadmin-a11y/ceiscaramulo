import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { usePublicProjects } from '../hooks/useCmsContent';

const statusLabels = {
  em_curso: { label: 'Em curso', tone: 'bg-[#e9f0e3] text-[#27441d]' },
  concluido: { label: 'Concluído', tone: 'bg-stone-200 text-stone-700' },
  planeado: { label: 'Planeado', tone: 'bg-[#f7eed6] text-[#8a6a26]' },
};

const Projetos: React.FC = () => {
  const { data: projects = [], isLoading } = usePublicProjects();

  return (
    <>
      <SEOHead title="Projetos — CEISCaramulo" description="Conheça os projetos de investigação, conservação e valorização territorial do CEISCaramulo." keywords="projetos, conservação, investigação, Serra do Caramulo" />
      <div className="bg-[#f9faf7]">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Investigação e conservação</p>
            <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">Projetos que deixam conhecimento e impacto no território.</h1>
          </div>
          <div className="self-end pb-2 lg:col-span-5">
            <p className="text-base leading-[1.7] text-[#43483f]">Desenvolvemos iniciativas de monitorização, educação e regeneração que ajudam a construir um futuro mais informado para a Serra do Caramulo.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8">
          {isLoading ? <div className="rounded bg-white p-8 text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70">A carregar projetos...</div> : null}
          {projects.map((project) => {
            const status = statusLabels[project.status];

            return (
              <Link key={project.id} to={`/projetos/${project.id}`} className="block rounded bg-white p-8 shadow-sm ring-1 ring-stone-200/70 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span>
                    <h2 className="mt-5 font-display text-[2.3rem] leading-[1.05] text-[#27441d]">{project.title}</h2>
                    <p className="mt-4 text-sm leading-[1.8] text-[#5f6559]">{project.description}</p>
                    {project.partners?.length ? <div className="mt-5 flex flex-wrap gap-2">{project.partners.map((partner) => <span key={partner} className="rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600">{partner}</span>)}</div> : null}
                  </div>
                  <div className="min-w-[180px] text-sm leading-7 text-[#43483f]">
                    <p><span className="font-semibold text-[#27441d]">Início:</span> {new Date(project.startDate).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</p>
                    {project.endDate ? <p><span className="font-semibold text-[#27441d]">Fim:</span> {new Date(project.endDate).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</p> : null}
                  </div>
                </div>
              </Link>
            );
          })}
          {!isLoading && projects.length === 0 ? <div className="rounded bg-white p-8 text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70">Ainda não existem projetos publicados.</div> : null}
        </section>
      </div>
    </>
  );
};

export default Projetos;
