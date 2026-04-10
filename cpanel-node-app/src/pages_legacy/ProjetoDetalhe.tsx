import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ContentComments from '../components/ContentComments';
import SEOHead from '../components/SEOHead';
import AnimatedSection from '../components/AnimatedSection';
import { Container, Section, Text, Badge } from '../elements';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useProject } from '../hooks/useCmsContent';

const statusLabels: Record<string, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  em_curso: { label: 'Em Curso', variant: 'success' },
  concluido: { label: 'Concluído', variant: 'secondary' },
  planeado: { label: 'Planeado', variant: 'warning' },
};

const ProjetoDetalhe: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="body">A carregar projeto...</Text>
        </Container>
      </Section>
    );
  }

  if (!project) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="h2">Projeto não encontrado</Text>
          <Link to="/projetos">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar aos projetos
            </Button>
          </Link>
        </Container>
      </Section>
    );
  }

  const status = statusLabels[project.status];

  return (
    <>
      <SEOHead title={`${project.title} — CEISCaramulo`} description={project.description} keywords={`projetos, ${project.title}, CEISCaramulo, serra caramulo`} />

      <Section spacing="xl" className="pt-32">
        <Container>
          <AnimatedSection>
            <Link to="/projetos">
              <Button variant="ghost" className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar aos projetos
              </Button>
            </Link>

            <div className="mb-4 flex items-center gap-3">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <Text variant="h1" className="mb-6">{project.title}</Text>

            <div className="mb-8 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Início: {new Date(project.startDate).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
              </span>
              {project.endDate ? (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Fim: {new Date(project.endDate).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                </span>
              ) : null}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <Text variant="body" className="mb-8 max-w-3xl leading-relaxed">
              {project.description}
            </Text>

            {project.partners && project.partners.length > 0 ? (
              <div>
                <Text variant="h4" className="mb-3">Parceiros</Text>
                <div className="flex flex-wrap gap-2">
                  {project.partners.map((partner) => (
                    <Badge key={partner} variant="outline">{partner}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <ContentComments section="projects" identifier={project.id} title={project.title} />
          </AnimatedSection>
        </Container>
      </Section>
    </>
  );
};

export default ProjetoDetalhe;
