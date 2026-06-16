'use client';

import { FormEvent, useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || 'Não foi possível enviar a mensagem.');
      }

      setForm(initialForm);
      setFeedback({
        type: 'success',
        message: payload.message || 'Mensagem enviada com sucesso.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground">Enviar mensagem</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Preencha o formulário e a equipa do CEISCaramulo responderá assim que possível.
        </p>
      </div>

      <label className="grid gap-1 text-sm text-stone-700">
        Nome
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="h-11 rounded-xl border border-stone-300 px-3"
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-stone-700">
        Email
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          className="h-11 rounded-xl border border-stone-300 px-3"
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-stone-700">
        Assunto
        <input
          type="text"
          value={form.subject}
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
          className="h-11 rounded-xl border border-stone-300 px-3"
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-stone-700">
        Mensagem
        <textarea
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          className="min-h-40 rounded-xl border border-stone-300 px-3 py-3"
          required
        />
      </label>

      {feedback ? (
        <div
          className={
            feedback.type === 'success'
              ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900'
              : 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900'
          }
        >
          {feedback.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[#0f4c36] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? 'A enviar…' : 'Enviar mensagem'}
      </button>
    </form>
  );
}
