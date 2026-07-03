'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type ContentSection = 'news' | 'activities' | 'projects' | 'publications';

type ContentComment = {
  id: string;
  name: string;
  email?: string;
  message: string;
  createdAt: string;
};

type ContentCommentsProps = {
  section: ContentSection;
  identifier: string;
  title: string;
};

export default function ContentComments({ section, identifier, title }: ContentCommentsProps) {
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', message: '' });

  const endpoint = useMemo(() => `/api/${section}/${identifier}/comments`, [section, identifier]);

  useEffect(() => {
    let mounted = true;

    async function loadComments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Não foi possível carregar os comentários.');
        }

        const data = (await response.json()) as ContentComment[];

        if (mounted) {
          setComments(Array.isArray(data) ? data : []);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Erro inesperado ao carregar comentários.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      mounted = false;
    };
  }, [endpoint]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload && typeof payload.message === 'string' ? payload.message : 'Não foi possível enviar o comentário.';
        throw new Error(message);
      }

      const createdComment = payload as ContentComment;
      setComments((current) => [createdComment, ...current]);
      setForm({ name: '', message: '' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado ao enviar comentário.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-12 rounded-xl border border-border bg-card p-6 sm:p-8" aria-labelledby={`comments-title-${identifier}`}>
      <h2 id={`comments-title-${identifier}`} className="font-display text-2xl font-bold text-foreground">
        Comentários
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">Partilhe a sua opinião sobre “{title}”.</p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-muted-foreground">
            <span>Nome</span>
            <input
              required
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={inputClassName}
            />
          </label>

        </div>

        <label className="grid gap-2 text-sm text-muted-foreground">
          <span>Mensagem</span>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className={textareaClassName}
          />
        </label>

        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'A enviar...' : 'Enviar comentário'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {isLoading ? <div className="rounded-lg bg-muted px-4 py-6 text-sm text-muted-foreground">A carregar comentários...</div> : null}

        {!isLoading && comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Ainda não existem comentários para este conteúdo.
          </div>
        ) : null}

        {comments.map((comment) => (
          <article key={comment.id} className="rounded-lg border border-border bg-muted/30 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-foreground">{comment.name}</h3>
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString('pt-PT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{comment.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const inputClassName =
  'h-11 rounded-lg border border-input bg-background px-3 text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring';
const textareaClassName =
  'rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring';
