import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import SEOHead from '../components/SEOHead';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEOHead title="404 — Página não encontrada | CEISCaramulo" description="A página pedida não foi encontrada." noindex />
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">A página que procura não existe ou foi movida.</p>
          <Link to="/" className="text-primary underline hover:text-primary/90">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
