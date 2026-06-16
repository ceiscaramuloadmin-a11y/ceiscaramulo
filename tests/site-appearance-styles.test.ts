/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'components/SiteAppearanceStyles.tsx'), 'utf8');
const layoutSource = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8');
const globalsSource = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');
const faviconSource = readFileSync(resolve(process.cwd(), 'public/favicon.svg'), 'utf8');
const ogImageSource = readFileSync(resolve(process.cwd(), 'public/og-image.svg'), 'utf8');
const placeholderSource = readFileSync(resolve(process.cwd(), 'public/placeholder.svg'), 'utf8');

describe('site appearance styles', () => {
  it('applies editable colors from public layout settings through CSS variables', () => {
    expect(source).toContain("fetch('/api/layout')");
    expect(source).toContain("root.style.setProperty('--primary'");
    expect(source).toContain("root.style.setProperty('--site-button-color'");
    expect(source).toContain("root.style.setProperty('--site-link-color'");
    expect(source).toContain("root.style.setProperty('--site-title-color'");
    expect(layoutSource).toContain('<SiteAppearanceStyles />');
  });

  it('uses the logo green as the fallback for legacy green utility classes', () => {
    expect(globalsSource).toContain('--primary: 158 67% 18%');
    expect(globalsSource).toContain("var(--site-button-color, #0f4c36)");
    expect(globalsSource).toContain("var(--site-title-color, #0f4c36)");
    expect(globalsSource).toContain('.bg-\\[\\#0f4c36\\]');
    expect(globalsSource).toContain('.text-\\[\\#0f4c36\\]');
    expect(faviconSource).toContain('#0f4c36');
    expect(faviconSource).not.toContain('#27441d');
    expect(faviconSource).not.toContain('#3e5c32');
    expect(ogImageSource).toContain('#0f4c36');
    expect(ogImageSource).not.toContain('#27441d');
    expect(placeholderSource).toContain('#0f4c36');
    expect(placeholderSource).not.toContain('#27441d');
  });

  it('defines restrained motion utilities with reduced-motion safeguards', () => {
    expect(globalsSource).toContain('@keyframes ceis-fade-rise');
    expect(globalsSource).toContain('@keyframes ceis-hero-title');
    expect(globalsSource).toContain('@keyframes ceis-hero-drift');
    expect(globalsSource).toContain('.motion-reveal[data-visible');
    expect(globalsSource).toContain('@media (prefers-reduced-motion: reduce)');
    expect(globalsSource).toContain('.ceis-hero-title-line');
    expect(globalsSource).toContain('.ceis-hero-slide-motion');
    expect(globalsSource).not.toContain("@import 'swiper/css'");
    expect(globalsSource).not.toContain('fonts.googleapis.com');
  });
});
