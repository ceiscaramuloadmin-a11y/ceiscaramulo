'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuthClient, isExportAdminAuthMode } from '@/lib/admin-auth';

export default function BackofficeLoginPage() {
  const router = useRouter();
  const exportAuthMode = isExportAdminAuthMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const sessionResult = await adminAuthClient.adapter.getSession();

      if (sessionResult?.data?.session) {
        router.replace('/backoffice');
      }
    };

    void checkSession();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await adminAuthClient.adapter.signIn.email({
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error.message || 'Não foi possível iniciar sessão.');
      }

      router.replace('/backoffice');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Falha ao autenticar na área administrativa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl text-[#27441d]">Login do Backoffice</h1>
      <p className="mt-3 text-sm text-stone-600">
        {exportAuthMode
          ? 'Use as credenciais configuradas para o modo export estático.'
          : 'Use as credenciais administrativas configuradas no servidor para aceder à área administrativa.'}
      </p>

      <form className="mt-8 space-y-4 rounded-xl border border-stone-200 bg-white p-6" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-stone-700">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-lg border border-stone-300 px-3"
            placeholder="admin@ceiscaramulo.pt"
          />
        </label>

        <label className="grid gap-2 text-sm text-stone-700">
          Palavra-passe
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-lg border border-stone-300 px-3"
            placeholder="••••••••"
          />
        </label>

        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-lg bg-[#27441d] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f5224] disabled:opacity-70"
        >
          {isSubmitting ? 'A autenticar…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
