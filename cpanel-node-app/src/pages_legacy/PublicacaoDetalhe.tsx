import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';

import AnimatedSection from '../components/AnimatedSection';
import ContentComments from '../components/ContentComments';
import SEOHead from '../components/SEOHead';
import { Button } from '../components/ui/button';
import { Container, Section, Text } from '../elements';
import { usePublication } from '../hooks/useCmsContent';
import { getAssetUrl } from '../lib/api';

const typeLabels: Record<string, string> = {
  livro: 'Livro',
  artigo: 'Artigo',
  relatorio: 'Relatório',
  tese: 'Tese',
  documento: 'Documento',
};

const PublicacaoDetalhe: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data: publication, isLoading } = usePublication(id);

  if (isLoading) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="body">A carregar publicação...</Text>
        </Container>
      </Section>
    );
  }

  if (!publication) {
    return (
      <Section spacing="xl" className="pt-32">
        <Container>
          <Text variant="h2">Publicação não encontrada</Text>
          <Link to="/biblioteca">
            <Button variant="ghost" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar à biblioteca
            </Button>
          </Link>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <SEOHead
        title={`${publication.title} — CEISCaramulo`}
        description={publication.description}
        keywords={`${publication.type}, biblioteca, ${publication.title}, CEISCaramulo`}
      />

      <Section spacing="xl" className="pt-32">
        <Container>
          <AnimatedSection>
            <Link to="/biblioteca">
              <Button variant="ghost" className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar à biblioteca
              </Button>
            </Link>

            <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
                {publication.coverImage ? (
                  <img src={getAssetUrl(publication.coverImage)} alt={publication.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center bg-[#f3f4f1] text-[#27441d]">
                    <FileText className="h-12 w-12" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div>
                <span className="inline-flex rounded-full bg-[#edf3e8] px-3 py-1 text-xs font-medium text-[#27441d]">
                  {typeLabels[publication.type] || publication.type}
                </span>
                <Text variant="h1" className="mt-5">{publication.title}</Text>
                <p className="mt-4 text-lg text-[#3e5c32]">{publication.author}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.14em] text-stone-500">{publication.year}</p>
                <Text variant="body" className="mt-8 max-w-3xl leading-relaxed">
                  {publication.description}
                </Text>

                {publication.downloadUrl ? (
                  <a
                    href={publication.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#27441d] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2f5224]"
                  >
                    <Download className="h-4 w-4" />
                    Aceder ao ficheiro
                  </a>
                ) : null}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <ContentComments section="publications" identifier={publication.id} title={publication.title} />
          </AnimatedSection>
        </Container>
      </Section>
    </>
  );
};

export default PublicacaoDetalhe;
