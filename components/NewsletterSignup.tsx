'use client';

import React, { useCallback, useState } from 'react';

/**
 * Formulário mínimo de subscrição: envia apenas o email público para a API,
 * mantendo cópias amigáveis e sem fugas de dados sobre lista existente (upsert sempre responde OK).
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'ok' | 'err'; text: string } | null>(null);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setFeedback(null);
      const trimmed = email.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setFeedback({ variant: 'err', text: 'Introduce um email válido para subscrever.' });
        return;
      }

      setPending(true);

      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = (await response.json()) as { ok?: boolean; message?: string };

        setFeedback({
          variant: response.ok && data.ok ? 'ok' : 'err',
          text: typeof data.message === 'string' ? data.message : 'Algo correu mal. Tenta mais tarde.',
        });

        if (response.ok && data.ok) {
          setEmail('');
        }
      } catch {
        setFeedback({
          variant: 'err',
          text: 'Falhou a ligação ao servidor. Verifica a rede e tenta novamente.',
        });
      } finally {
        setPending(false);
      }
    },
    [email]
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-[#0f4c36]">Newsletter</h3>
      <p className="text-xs leading-relaxed text-stone-500">Recebe novidades sobre atividades e notícias (sem spam).</p>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="newsletter-email">
          Email da newsletter
        </label>
        <input
          id="newsletter-email"
          name="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="nome@servidor.pt"
          value={email}
          disabled={pending}
          aria-invalid={feedback?.variant === 'err' ? 'true' : undefined}
          aria-describedby={feedback ? 'newsletter-feedback' : undefined}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-[#0f4c36]"
        />

        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-[#0f4c36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b3d2b] disabled:opacity-75"
        >
          {pending ? 'A registar…' : 'Subscrever'}
        </button>
      </form>

      {feedback ? (
        <div
          id="newsletter-feedback"
          className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
            feedback.variant === 'ok'
              ? 'border-[#0f4c36]/25 bg-[#0f4c36]/10 text-[#0f4c36]'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
          role={feedback.variant === 'err' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.text}
        </div>
      ) : null}
    </div>
  );
}
