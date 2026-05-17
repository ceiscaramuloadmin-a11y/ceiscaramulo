import SiteLogo from '@/components/SiteLogo';

export default function FullScreenLoading() {
  return (
    <main
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-white px-6 text-center"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <SiteLogo imageClassName="h-16 w-auto" />
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
        <p className="text-sm font-medium text-stone-600">A carregar conteúdo...</p>
      </div>
    </main>
  );
}
