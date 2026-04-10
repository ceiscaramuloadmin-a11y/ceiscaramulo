'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { contactInfo } from '@/data/site';
import { defaultSiteLayoutSettings } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

const socialLinks = [
  { label: 'Instagram', href: contactInfo.socialMedia.instagram },
  { label: 'Facebook', href: contactInfo.socialMedia.facebook },
  { label: 'YouTube', href: contactInfo.socialMedia.youtube },
].filter((item): item is { label: string; href: string } => Boolean(item.href));

const Footer: React.FC = () => {
  const pathname = usePathname();
  const [layoutSettings, setLayoutSettings] = useState<SiteLayoutSettings>(defaultSiteLayoutSettings);

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
            <Link href="/" className="font-display text-[1.7rem] text-[#3e5c32]">
              CEISCaramulo
            </Link>
            <p className="max-w-xs text-sm leading-[1.7] text-stone-500">
              {layoutSettings.footer.brandDescription}
            </p>
          </div>

          {layoutSettings.footer.columns.map((column) => (
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
            <div className="mt-6 grid gap-4">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-stone-500 underline-offset-4 transition-colors hover:text-[#3e5c32] hover:underline"
                >
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
