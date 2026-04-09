import React, { useState } from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone, Send, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '../components/SEOHead';
import { contactInfo } from '../data/site';

const Contactos: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Mensagem enviada com sucesso! Entraremos em contacto brevemente.');
      event.currentTarget.reset();
    }, 1200);
  };

  return (
    <>
      <SEOHead title="Contactos — CEISCaramulo" description="Entre em contacto com o CEISCaramulo para informações, parcerias ou participação nas atividades." keywords="contactos, formulário, telefone, email, CEISCaramulo" />
      <div className="bg-[#f9faf7]">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Fale connosco</p>
            <h1 className="mt-4 font-display text-[3.1rem] leading-[0.95] text-[#27441d] sm:text-[4.5rem]">Estamos aqui para o ouvir e colaborar.</h1>
          </div>
          <div className="self-end pb-2 lg:col-span-5">
            <p className="text-base leading-[1.7] text-[#43483f]">Quer seja um habitante local, um investigador ou um entusiasta da Serra do Caramulo, a sua mensagem é importante para a preservação do nosso património.</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="rounded bg-white p-8 shadow-sm ring-1 ring-stone-200/70 lg:col-span-2">
            <h2 className="font-display text-[2rem] text-[#27441d]">Envie uma mensagem</h2>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[#73796e]">Nome Completo<input required type="text" placeholder="O seu nome" className="h-12 rounded border border-transparent bg-[#e2e3e0] px-4 text-sm text-[#27441d] outline-none transition focus:border-[#3e5c32]" /></label>
                <label className="grid gap-2 text-sm text-[#73796e]">E-mail<input required type="email" placeholder="exemplo@email.com" className="h-12 rounded border border-transparent bg-[#e2e3e0] px-4 text-sm text-[#27441d] outline-none transition focus:border-[#3e5c32]" /></label>
              </div>
              <label className="grid gap-2 text-sm text-[#73796e]">Assunto<input required type="text" placeholder="Como podemos ajudar?" className="h-12 rounded border border-transparent bg-[#e2e3e0] px-4 text-sm text-[#27441d] outline-none transition focus:border-[#3e5c32]" /></label>
              <label className="grid gap-2 text-sm text-[#73796e]">Mensagem<textarea required rows={7} placeholder="Escreva aqui a sua mensagem..." className="rounded border border-transparent bg-[#e2e3e0] px-4 py-3 text-sm text-[#27441d] outline-none transition focus:border-[#3e5c32]" /></label>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded bg-[#27441d] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#2f5224] disabled:cursor-wait disabled:opacity-70">
                {isSubmitting ? 'A enviar...' : 'Enviar Mensagem'}<Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="rounded bg-[#f3f4f1] p-8 shadow-sm ring-1 ring-stone-200/70">
              <h2 className="font-display text-[1.8rem] text-[#27441d]">Informações de Contacto</h2>
              <div className="mt-8 space-y-5 text-sm text-[#43483f]">
                <div className="flex items-start gap-4"><MapPin className="mt-1 h-4 w-4 text-[#27441d]" /><div><p className="font-semibold text-[#191c1b]">Morada</p><p>{contactInfo.address}</p><p>{contactInfo.postalCode} {contactInfo.city}, Portugal</p></div></div>
                <div className="flex items-start gap-4"><Phone className="mt-1 h-4 w-4 text-[#27441d]" /><div><p className="font-semibold text-[#191c1b]">Telefone</p><a href={`tel:${contactInfo.phone}`} className="hover:text-[#27441d]">{contactInfo.phone}</a></div></div>
                <div className="flex items-start gap-4"><Mail className="mt-1 h-4 w-4 text-[#27441d]" /><div><p className="font-semibold text-[#191c1b]">Email</p><a href={`mailto:${contactInfo.email}`} className="hover:text-[#27441d]">{contactInfo.email}</a></div></div>
              </div>

              <div className="mt-10">
                <h3 className="font-display text-[1.5rem] text-[#27441d]">Horário de Funcionamento</h3>
                <div className="mt-5 space-y-2 text-sm text-[#43483f]">
                  <div className="flex items-center justify-between"><span>Segunda — Sexta</span><span className="font-medium text-[#191c1b]">09:00 - 18:00</span></div>
                  <div className="flex items-center justify-between"><span>Sábado</span><span className="font-medium text-[#191c1b]">10:00 - 13:00</span></div>
                  <div className="flex items-center justify-between"><span className="text-[#73796e]">Domingo</span><span className="text-[#73796e]">Encerrado</span></div>
                </div>
              </div>
            </div>

            <div className="flex min-h-[280px] items-center justify-center rounded bg-[#e2e3e0] p-8 shadow-sm ring-1 ring-stone-200/70">
              <a href={`https://www.google.com/maps?q=${contactInfo.coordinates.lat},${contactInfo.coordinates.lng}`} target="_blank" rel="noreferrer" className="rounded bg-white px-5 py-3 text-sm font-medium text-[#27441d] shadow">Ver no Google Maps</a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 rounded bg-[#27441d] px-8 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-[2rem] text-white">Siga a nossa jornada</h2>
              <p className="mt-3 max-w-xl text-sm leading-[1.8] text-[#aed09c]">Acompanhe as nossas atividades diárias e projetos em curso através das redes sociais.</p>
            </div>
            <div className="flex gap-4">
              {contactInfo.socialMedia.instagram ? <a href={contactInfo.socialMedia.instagram} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded bg-[#3e5c32] text-white" aria-label="Instagram"><Instagram className="h-4 w-4" /></a> : null}
              {contactInfo.socialMedia.facebook ? <a href={contactInfo.socialMedia.facebook} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded bg-[#3e5c32] text-white" aria-label="Facebook"><Facebook className="h-4 w-4" /></a> : null}
              {contactInfo.socialMedia.youtube ? <a href={contactInfo.socialMedia.youtube} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded bg-[#3e5c32] text-white" aria-label="YouTube"><Youtube className="h-4 w-4" /></a> : null}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contactos;
