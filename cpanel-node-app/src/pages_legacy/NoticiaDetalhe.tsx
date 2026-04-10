import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react';

import AnimatedSection from '../components/AnimatedSection';
import ContentComments from '../components/ContentComments';
import RichTextContent from '../components/RichTextContent';
import SEOHead from '../components/SEOHead';
import { Button } from '../components/ui/button';
import { Container, Section, Text } from '../elements';
import { useNewsArticle } from '../hooks/useCmsContent';
import { getAssetUrl } from '../lib/api';

const NoticiaDetalhe: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useNewsArticle(slug);

  if (isLoading) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="body">A carregar notícia...</Text>
        </Container>
      </Section>
    );
  }

  if (!article) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="h2">Notícia não encontrada</Text>
          <Link to="/noticias">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar às notícias
            </Button>
          </Link>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <SEOHead title={`${article.title} — CEISCaramulo`} description={article.excerpt} keywords={`${article.category}, CEISCaramulo, serra caramulo`} />

      <Section spacing="xl" className="pt-32">
        <Container>
          <AnimatedSection>
            <Link to="/noticias">
              <Button variant="ghost" className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar às notícias
              </Button>
            </Link>

            <div className="mb-4 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" /> {article.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(article.publishedAt || article.createdAt || '').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" /> {article.author}
              </span>
            </div>

            <Text variant="h1" className="mb-6">{article.title}</Text>
            <Text variant="lead" color="muted" className="mb-8">{article.excerpt}</Text>
            {article.image ? (
              <img
                src={getAssetUrl(article.image)}
                alt={article.title}
                className="mb-8 h-auto w-full rounded-[2rem] border border-stone-200 bg-white object-cover shadow-sm"
              />
            ) : null}
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <RichTextContent html={article.content} className="max-w-none" />
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <ContentComments section="news" identifier={article.id} title={article.title} />
          </AnimatedSection>
        </Container>
      </Section>
    </>
  );
};

export default NoticiaDetalhe;
