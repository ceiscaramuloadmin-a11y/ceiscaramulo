'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Linkedin, Facebook, Youtube } from 'lucide-react';
import SiteLogo from '@/components/SiteLogo';
import NewsletterSignup from '@/components/NewsletterSignup';
import { contactInfo } from '@/data/site';
import { defaultSiteLayoutSettings } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

const socialLinks = [
  { label: 'Instagram', href: contactInfo.socialMedia.instagram, Icon: Instagram },
  { label: 'LinkedIn', href: contactInfo.socialMedia.linkedin, Icon: Linkedin },
  { label: 'Facebook', href: contactInfo.socialMedia.facebook, Icon: Facebook },
  { label: 'YouTube', href: contactInfo.socialMedia.youtube, Icon: Youtube },
].filter((item): item is { label: string; href: string; Icon: typeof Instagram } => Boolean(item.href));

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
              <SiteLogo imageClassName="h-14 w-auto" />
            </Link>
            <p className="max-w-xs text-sm leading-[1.7] text-stone-500">
              {layoutSettings.footer.brandDescription}
            </p>
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
            <h3 className="text-sm font-bold text-[#3e5c32]">{layoutSettings.footer.socialTitle}</h3>
            <div className="mt-6 grid gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-[#3e5c32]"
                >
                  <item.Icon className="h-4 w-4" />
                  {item.label}
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
