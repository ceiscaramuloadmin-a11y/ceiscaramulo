import React, { useEffect, useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import SEOHead from '../components/SEOHead';
import { neonAuth } from '../lib/neon-auth';

const BackofficeLogin: React.FC = () => {
  const navigate = useNavigate();
  const session = neonAuth.adapter.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (session.data?.session) {
      navigate('/backoffice', { replace: true });
    }
  }, [navigate, session.data]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await neonAuth.adapter.signIn.email({
        email,
        password,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Não foi possível iniciar sessão.');
      }

      navigate('/backoffice', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao autenticar no Neon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead title="Backoffice Login — CEISCaramulo" description="Acesso ao backoffice do CEISCaramulo." keywords="backoffice, login, administração" noindex />
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5ef] px-4 py-16">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)] lg:grid-cols-2">
          <div className="bg-[#27441d] px-8 py-12 text-white sm:px-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#aed09c]">Administração</p>
            <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95]">Backoffice CEISCaramulo</h1>
            <p className="mt-6 max-w-md text-sm leading-[1.8] text-[#d6e6cb]">
              Área de gestão para acompanhar conteúdos, mensagens, agenda editorial e estado geral do site.
            </p>
          </div>

          <div className="px-8 py-12 sm:px-12">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Entrar</p>
            <h2 className="mt-4 font-display text-[2.2rem] text-[#27441d]">Acesso reservado</h2>
            <p className="mt-4 text-sm leading-[1.8] text-stone-500">
              O acesso ao backoffice é autenticado pelo Neon Auth usando as variáveis de ambiente configuradas no projeto.
            </p>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-stone-600">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@ceiscaramulo.pt"
                  className="h-12 rounded-xl border border-stone-200 bg-stone-50 px-4 outline-none transition focus:border-[#3e5c32]"
                />
              </label>
              <label className="grid gap-2 text-sm text-stone-600">
                Palavra-passe
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border border-stone-200 bg-stone-50 px-4 outline-none transition focus:border-[#3e5c32]"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting || session.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#27441d] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2f5224] disabled:opacity-70"
              >
                <LockKeyhole className="h-4 w-4" />
                {isSubmitting ? 'A validar...' : 'Entrar no backoffice'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default BackofficeLogin;
