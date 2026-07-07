import Link from 'next/link';

export default function NewsletterSignup() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-[#0f4c36]">Newsletter</h3>
      <p className="text-xs leading-relaxed text-stone-500">Escolhe se queres receber noticias, atividades ou ambas.</p>
      <Link
        href="/newsletter"
        className="mt-4 inline-flex w-full justify-center rounded-lg bg-[#0f4c36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b3d2b]"
      >
        Subscrever newsletter
      </Link>
    </div>
  );
}
