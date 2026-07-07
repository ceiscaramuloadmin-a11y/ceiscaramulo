'use client';

import React, { useCallback, useState } from 'react';

export default function NewsletterIntentForm() {
  const [email, setEmail] = useState('');
  const [wantsNews, setWantsNews] = useState(true);
  const [wantsActivities, setWantsActivities] = useState(true);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'ok' | 'err'; text: string } | null>(null);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setFeedback(null);

      const trimmed = email.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setFeedback({ variant: 'err', text: 'Introduz um email valido para subscrever.' });
        return;
      }

      if (!wantsNews && !wantsActivities) {
        setFeedback({ variant: 'err', text: 'Seleciona pelo menos noticias ou atividades.' });
        return;
      }

      setPending(true);

      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, wantsNews, wantsActivities }),
        });
        const data = (await response.json()) as { ok?: boolean; message?: string };

        setFeedback({
          variant: response.ok && data.ok ? 'ok' : 'err',
          text: typeof data.message === 'string' ? data.message : 'Algo correu mal. Tenta mais tarde.',
        });

        if (response.ok && data.ok) {
          setEmail('');
          setWantsNews(true);
          setWantsActivities(true);
        }
      } catch {
        setFeedback({
          variant: 'err',
          text: 'Falhou a ligacao ao servidor. Verifica a rede e tenta novamente.',
        });
      } finally {
        setPending(false);
      }
    },
    [email, wantsActivities, wantsNews]
  );

  return (
    <form className="grid gap-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm" onSubmit={submit} noValidate>
      <label className="grid gap-2 text-sm font-medium text-stone-700" htmlFor="newsletter-email">
        Email
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nome@servidor.pt"
          value={email}
          disabled={pending}
          aria-invalid={feedback?.variant === 'err' ? 'true' : undefined}
          aria-describedby={feedback ? 'newsletter-feedback' : undefined}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-[#0f4c36]"
        />
      </label>

      <fieldset className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <legend className="px-1 text-sm font-semibold text-[#0f4c36]">Quero receber</legend>
        <label className="flex items-start gap-3 text-sm text-stone-700">
          <input
            type="checkbox"
            name="wantsNews"
            checked={wantsNews}
            disabled={pending}
            onChange={(event) => setWantsNews(event.target.checked)}
            className="mt-1"
          />
          <span>Noticias do CEISCaramulo</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-stone-700">
          <input
            type="checkbox"
            name="wantsActivities"
            checked={wantsActivities}
            disabled={pending}
            onChange={(event) => setWantsActivities(event.target.checked)}
            className="mt-1"
          />
          <span>Atividades e eventos</span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full justify-center rounded-lg bg-[#0f4c36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3d2b] disabled:opacity-75"
      >
        {pending ? 'A guardar...' : 'Guardar subscricao'}
      </button>

      {feedback ? (
        <div
          id="newsletter-feedback"
          className={`rounded-lg border px-3 py-2 text-sm leading-relaxed ${
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
    </form>
  );
}
