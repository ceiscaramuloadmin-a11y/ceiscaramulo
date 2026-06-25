/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const homePageSource = readFileSync(resolve(process.cwd(), 'app/page.tsx'), 'utf8');

describe('homepage cards', () => {
  it('renders cover images for activity and news cards', () => {
    expect(homePageSource).toContain("import CoverImage from '@/components/CoverImage'");
    expect(homePageSource).toContain('<CoverImage');
    expect(homePageSource).toContain('src={getAssetUrl(activity.image)}');
    expect(homePageSource).toContain('src={getAssetUrl(article.image)}');
  });

  it('uses the local hero image asset for the homepage hero', () => {
    expect(homePageSource).toContain("imageUrl: '/hero-imgs/hero-img.webp'");
    expect(homePageSource).toContain('<HomeHero hero={hero}');
  });

  it('renders activity and news card copy as rich text previews instead of raw html strings', () => {
    expect(homePageSource).toContain('richTextToPlainText(activity.description)');
    expect(homePageSource).toContain('richTextToPlainText(article.excerpt)');
  });

  it('shows the newest created news and activities first', () => {
    expect(homePageSource).toContain("orderBy: [{ createdAt: 'desc' }, { publishedAt: 'desc' }]");
    expect(homePageSource).toContain("orderBy: [{ createdAt: 'desc' }, { date: 'desc' }]");
  });

  it('uses compact responsive cards for homepage activities and news', () => {
    expect(homePageSource).toContain("import MotionReveal from '@/components/MotionReveal'");
    expect(homePageSource).toContain('grid-cols-[repeat(auto-fit,minmax(220px,300px))]');
    expect(homePageSource).toContain('grid-cols-[repeat(auto-fit,minmax(240px,320px))]');
    expect(homePageSource).toContain('aspect-[4/3]');
    expect(homePageSource).toContain('loading="lazy"');
    expect(homePageSource).toContain('decoding="async"');
    expect(homePageSource).toContain('p-4');
    expect(homePageSource).toContain('text-xl');
    expect(homePageSource).toContain('<MotionReveal key={activity.id} className="h-full" delayMs={index * 90}>');
    expect(homePageSource).toContain('<MotionReveal key={article.id} className="h-full" delayMs={index * 110}>');
    expect(homePageSource).toContain('group-hover:scale-[1.035]');
    expect(homePageSource).not.toContain('h-48 w-full');
    expect(homePageSource).not.toContain('h-56 w-full');
    expect(homePageSource).not.toContain('p-8 transition-all');
  });

  it('limits compact card titles to 2 lines and descriptions to 3 lines', () => {
    expect(homePageSource).toContain('[-webkit-line-clamp:2]');
    expect(homePageSource).toContain('richTextToPlainText(activity.description)');
    expect(homePageSource).toContain('richTextToPlainText(article.excerpt)');
    expect(homePageSource).toContain('[-webkit-line-clamp:3]');
  });

  it('does not highlight a Projetos carousel on the homepage (section removed from destaques)', () => {
    expect(homePageSource).not.toContain('async function getPublicProjects()');
    expect(homePageSource).not.toContain('getPublicProjects()');
    expect(homePageSource).not.toContain('getProjectSlug');
    expect(homePageSource).not.toContain('href="/projetos"');
    expect(homePageSource).not.toContain("href='/projetos'");
    expect(homePageSource).not.toContain('Em Destaque');
  });

  it('does not render the join / comunidade CTA block pulled from layout.home.join', () => {
    expect(homePageSource).not.toContain('layout.home.join.title');
    expect(homePageSource).not.toContain('layout.home.join.description');
  });
});
