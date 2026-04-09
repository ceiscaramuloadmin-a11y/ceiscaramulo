// Next.js: Replace with app/layout.tsx
// This is the main app wrapper for React SPA
// In Next.js, routing is file-based — remove BrowserRouter and Routes

import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster as Sonner } from './components/ui/sonner';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { SkeletonCard } from './elements';

/* ──────────────────────────────────────────────
   Lazy loaded pages for performance
   Next.js: Remove lazy loading — Next.js handles
   code splitting automatically per route
────────────────────────────────────────────── */
const Index = lazy(() => import('./pages/Index'));
const SobreNos = lazy(() => import('./pages/SobreNos'));
const Atividades = lazy(() => import('./pages/Atividades'));
const AtividadeDetalhe = lazy(() => import('./pages/AtividadeDetalhe'));
const Noticias = lazy(() => import('./pages/Noticias'));
const NoticiaDetalhe = lazy(() => import('./pages/NoticiaDetalhe'));
const Projetos = lazy(() => import('./pages/Projetos'));
const ProjetoDetalhe = lazy(() => import('./pages/ProjetoDetalhe'));
const Biblioteca = lazy(() => import('./pages/Biblioteca'));
const PublicacaoDetalhe = lazy(() => import('./pages/PublicacaoDetalhe'));
const SerraDoCaramulo = lazy(() => import('./pages/SerraDoCaramulo'));
const Galeria = lazy(() => import('./pages/Galeria'));
const Contactos = lazy(() => import('./pages/Contactos'));
const Backoffice = lazy(() => import('./pages/Backoffice'));
const BackofficeLogin = lazy(() => import('./pages/BackofficeLogin'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ServerError = lazy(() => import('./pages/ServerError'));

const queryClient = new QueryClient();

/* Page loading fallback with skeleton */
const PageLoader = () => (
  <div className="min-h-screen px-4 pt-32" role="status" aria-live="polite">
    <div className="mx-auto max-w-7xl space-y-6">
      <SkeletonCard />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  </div>
);

const AppLayout = () => {
  const location = useLocation();
  const showChrome = location.pathname !== '/' && !location.pathname.startsWith('/backoffice');

  return (
    <>
      {showChrome ? <Header /> : null}
      <main id="main-content" role="main" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sobre-nos" element={<SobreNos />} />
            <Route path="/atividades" element={<Atividades />} />
            <Route path="/atividades/:id" element={<AtividadeDetalhe />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/noticias/:slug" element={<NoticiaDetalhe />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/projetos/:id" element={<ProjetoDetalhe />} />
            <Route path="/biblioteca" element={<Biblioteca />} />
            <Route path="/biblioteca/:id" element={<PublicacaoDetalhe />} />
            <Route path="/serra-do-caramulo" element={<SerraDoCaramulo />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="/backoffice" element={<Backoffice />} />
            <Route path="/backoffice/login" element={<BackofficeLogin />} />
            <Route path="/erro" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {showChrome ? <Footer /> : null}
      <ScrollToTop />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
