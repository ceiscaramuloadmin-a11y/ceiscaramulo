'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Youtube } from 'lucide-react';
import SiteLogo from '@/components/SiteLogo';
import NewsletterSignup from '@/components/NewsletterSignup';
import { defaultSiteLayoutSettings } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

const SocialIcon = ({ label }: { label: string }) => {
  if (label === 'Facebook') {
    return <span className="text-[1.45rem] font-black leading-none tracking-normal">f</span>;
  }

  if (label === 'LinkedIn') {
    return <span className="text-[1.05rem] font-black leading-none tracking-normal">in</span>;
  }

  if (label === 'YouTube') {
    return <Youtube className="h-6 w-6" fill="currentColor" strokeWidth={1.8} />;
  }

  return <Instagram className="h-6 w-6" strokeWidth={2.2} />;
};

const getPublicFooterColumns = (settings: SiteLayoutSettings) =>
  settings.footer.columns
    .filter((column) => !column.title.toLowerCase().includes('restrita'))
    .map((column) => ({
      ...column,
      links: column.links.filter((item) => !item.href.startsWith('/backoffice')),
    }))
    .filter((column) => column.links.length > 0);

const Footer: React.FC = () => {
  const pathname = usePathname();
  const [layoutSettings, setLayoutSettings] = useState<SiteLayoutSettings>(defaultSiteLayoutSettings);
  const footerColumns = getPublicFooterColumns(layoutSettings);
  const footerContact = layoutSettings.footer.contactInfo;
  const socialLinks = [
    { label: 'Facebook', href: footerContact.socialMedia.facebook },
    { label: 'LinkedIn', href: footerContact.socialMedia.linkedin },
    { label: 'YouTube', href: footerContact.socialMedia.youtube },
    { label: 'Instagram', href: footerContact.socialMedia.instagram },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));
  const footerAddress = [footerContact.address, footerContact.postalCode, footerContact.city].filter(Boolean).join(', ');

  useEffect(() => {
    let mounted = true;

    const loadLayout = async () => {
      try {
        const response = await fetch('/api/layout');

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as SiteLayoutSettings;

        if (mounted) {
          setLayoutSettings(payload);
        }
      } catch {
        // fallback silencioso para definições por omissão
      }
    };

    void loadLayout();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="border-t border-stone-200/60 bg-[#f5f5f4]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center" aria-label="CEISCaramulo - Página inicial">
              <SiteLogo imageClassName="h-20 w-auto sm:h-24" />
            </Link>
            <NewsletterSignup />
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-bold text-[#3e5c32]">{column.title}</h3>
              <div className="mt-6 grid gap-4">
                {column.links.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={isActive ? 'text-sm font-semibold text-[#3e5c32] underline' : 'text-sm text-stone-500 underline-offset-4 transition-colors hover:text-[#3e5c32] hover:underline'}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-bold text-[#3e5c32]">Contactos</h3>
            <div className="mt-6 grid gap-3 text-sm text-stone-500">
              {footerAddress ? <p>{footerAddress}</p> : null}
              {footerContact.phone ? (
                <a className="underline-offset-4 transition-colors hover:text-[#3e5c32] hover:underline" href={`tel:${footerContact.phone.replace(/\s+/g, '')}`}>
                  {footerContact.phone}
                </a>
              ) : null}
              {footerContact.email ? (
                <a className="underline-offset-4 transition-colors hover:text-[#3e5c32] hover:underline" href={`mailto:${footerContact.email}`}>
                  {footerContact.email}
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#3e5c32]">{layoutSettings.footer.socialTitle}</h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-8 w-8 items-center justify-center text-[#3e5c32] transition-colors hover:text-[#6f8f3a]"
                >
                  <SocialIcon label={item.label} />
                  <span className="sr-only">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200/80">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-stone-500 sm:px-6 lg:px-8">
          {layoutSettings.footer.copyrightLine}
          <div className="mt-2 text-xs uppercase tracking-[0.1em] text-stone-500">{layoutSettings.footer.legalLine}</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
