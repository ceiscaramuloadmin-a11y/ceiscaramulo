import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ContentComments from '../components/ContentComments';
import SEOHead from '../components/SEOHead';
import AnimatedSection from '../components/AnimatedSection';
import { Container, Section, Text, Badge } from '../elements';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useActivity } from '../hooks/useCmsContent';

const categoryLabels: Record<string, string> = {
  caminhada: 'Caminhada',
  workshop: 'Workshop',
  palestra: 'Palestra',
  evento: 'Evento',
  formacao: 'Formação',
};

const AtividadeDetalhe: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data: activity, isLoading } = useActivity(id);

  if (isLoading) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="body">A carregar atividade...</Text>
        </Container>
      </Section>
    );
  }

  if (!activity) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="h2">Atividade não encontrada</Text>
          <Link to="/atividades">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar às atividades
            </Button>
          </Link>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <SEOHead title={`${activity.title} — CEISCaramulo`} description={activity.description} keywords={`${activity.category}, atividades, CEISCaramulo, serra caramulo`} />

      <Section spacing="xl" className="pt-32">
        <Container>
          <AnimatedSection>
            <Link to="/atividades">
              <Button variant="ghost" className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar às atividades
              </Button>
            </Link>

            <Badge variant="outline" className="mb-4">{categoryLabels[activity.category]}</Badge>

            <Text variant="h1" className="mb-6">{activity.title}</Text>

            <div className="mb-8 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(activity.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {activity.location ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {activity.location}
                </span>
              ) : null}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <Text variant="body" className="max-w-3xl leading-relaxed">
              {activity.description}
            </Text>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <ContentComments section="activities" identifier={activity.id} title={activity.title} />
          </AnimatedSection>
        </Container>
      </Section>
    </>
  );
};

export default AtividadeDetalhe;
