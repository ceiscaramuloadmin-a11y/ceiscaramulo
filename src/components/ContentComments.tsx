import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

import { createComment } from '../lib/api';
import { cmsQueryKeys, useContentComments } from '../hooks/useCmsContent';
import type { ContentSection } from '../types';

type ContentCommentsProps = {
  section: ContentSection;
  identifier: string;
  title: string;
};

export default function ContentComments({ section, identifier, title }: ContentCommentsProps) {
  const queryClient = useQueryClient();
  const commentsQuery = useContentComments(section, identifier, Boolean(identifier));
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const createMutation = useMutation({
    mutationFn: () => createComment(section, identifier, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.comments(section, identifier) });
      setForm({ name: '', email: '', message: '' });
      toast.success('Comentário enviado com sucesso.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <section className="mt-16 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby={`comments-title-${identifier}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3e8] text-[#27441d]">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 id={`comments-title-${identifier}`} className="font-display text-[2rem] text-[#27441d]">Comentários</h2>
          <p className="text-sm text-stone-500">Partilhe a sua opinião sobre “{title}”.</p>
        </div>
      </div>

      <form
        className="mt-8 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-stone-600">
            <span>Nome</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={inputClassName}
              autoComplete="name"
            />
          </label>

          <label className="grid gap-2 text-sm text-stone-600">
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className={inputClassName}
              autoComplete="email"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm text-stone-600">
          <span>Mensagem</span>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className={textareaClassName}
          />
        </label>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs leading-6 text-stone-500">O email é usado apenas para registo e não será mostrado publicamente.</p>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#27441d] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2f5224] disabled:opacity-70"
          >
            <Send className="h-4 w-4" />
            {createMutation.isPending ? 'A enviar...' : 'Enviar comentário'}
          </button>
        </div>
      </form>

      <div className="mt-10 space-y-4">
        {commentsQuery.isLoading ? <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">A carregar comentários...</div> : null}
        {commentsQuery.data?.map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-[#27441d]">{comment.name}</h3>
              <p className="text-xs uppercase tracking-[0.12em] text-stone-500">
                {new Date(comment.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-[1.8] text-[#43483f]">{comment.message}</p>
          </article>
        ))}
        {!commentsQuery.isLoading && (commentsQuery.data?.length || 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            Ainda não existem comentários para este conteúdo.
          </div>
        ) : null}
      </div>
    </section>
  );
}

const inputClassName = 'h-12 rounded-xl border border-stone-200 bg-stone-50 px-4 outline-none transition focus:border-[#3e5c32]';
const textareaClassName = 'rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#3e5c32]';
