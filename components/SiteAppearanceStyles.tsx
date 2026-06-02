'use client';

import { useEffect } from 'react';
import { defaultSiteLayoutSettings } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

function hexToHsl(value: string) {
  const hex = value.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === r
      ? 60 * (((g - b) / delta) % 6)
      : max === g
        ? 60 * ((b - r) / delta + 2)
        : 60 * ((r - g) / delta + 4);

  return `${Math.round((hue + 360) % 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function applyAppearance(settings: SiteLayoutSettings) {
  const root = document.documentElement;
  const colors = settings.visualIdentity?.colors || defaultSiteLayoutSettings.visualIdentity.colors;
  const primary = hexToHsl(colors.primary);
  const secondary = hexToHsl(colors.secondary);
  const accent = hexToHsl(colors.accent);

  if (primary) {
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--ring', primary);
    root.style.setProperty('--forest', primary);
  }
  if (secondary) {
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--forest-dark', secondary);
  }
  if (accent) {
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--forest-light', accent);
  }

  root.style.setProperty('--site-button-color', colors.buttons);
  root.style.setProperty('--site-link-color', colors.links);
  root.style.setProperty('--site-title-color', colors.titles);
}

export default function SiteAppearanceStyles() {
  useEffect(() => {
    let mounted = true;
    applyAppearance(defaultSiteLayoutSettings);

    const load = async () => {
      try {
        const response = await fetch('/api/layout');
        if (!response.ok) return;
        const payload = (await response.json()) as SiteLayoutSettings;
        if (mounted) applyAppearance(payload);
      } catch {
        // Mantém as cores por omissão quando a API pública não está disponível.
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
