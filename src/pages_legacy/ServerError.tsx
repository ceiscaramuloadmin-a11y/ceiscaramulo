// Next.js: app/error.tsx (special file with 'use client')
// 'use client'
import React from 'react';
import { Link } from 'react-router-dom';
// Next.js: import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Container, Text } from '../elements';
import { Button } from '../components/ui/button';
import SEOHead from '../components/SEOHead';

const ServerError: React.FC = () => {
  return (
    <>
      <SEOHead
        title="500 — Erro interno | CEISCaramulo"
        description="Ocorreu um erro interno. Por favor tente novamente."
        noindex
      />
      <div className="flex min-h-screen items-center justify-center">
        <Container size="sm">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive/50 mb-6" aria-hidden="true" />
            <Text variant="h1" className="text-8xl font-bold text-destructive/20 mb-4">500</Text>
            <Text variant="h2" className="mb-4">Erro interno</Text>
            <Text variant="body" color="muted" className="mb-8 max-w-md mx-auto">
              Ocorreu um erro inesperado. A nossa equipa já foi notificada. Por favor tente novamente.
            </Text>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/"><Home className="mr-2 h-4 w-4" /> Página Inicial</Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
};

export default ServerError;
