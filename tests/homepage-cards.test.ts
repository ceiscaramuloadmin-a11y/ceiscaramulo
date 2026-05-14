/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const homePageSource = readFileSync(resolve(process.cwd(), 'app/page.tsx'), 'utf8');

describe('homepage cards', () => {
  it('renders cover images for activity and news cards', () => {
    expect(homePageSource).toContain('src={getAssetUrl(activity.image)}');
    expect(homePageSource).toContain('src={getAssetUrl(article.image)}');
  });

  it('renders activity and news card copy as rich text previews instead of raw html strings', () => {
    expect(homePageSource).toContain('richTextToPlainText(activity.description)');
    expect(homePageSource).toContain('richTextToPlainText(article.excerpt)');
  });

  it('limits card titles to 3 lines and descriptions to 4 lines', () => {
    expect(homePageSource).toContain('[-webkit-line-clamp:3]');
    expect(homePageSource).toContain('richTextToPlainText(activity.description)');
    expect(homePageSource).toContain('richTextToPlainText(article.excerpt)');
    expect(homePageSource).toContain('[-webkit-line-clamp:4]');
  });

  it('does not highlight a Projetos carousel on the homepage (section removed from destaques)', () => {
    expect(homePageSource).not.toContain('async function getPublicProjects()');
    expect(homePageSource).not.toContain('getPublicProjects()');
    expect(homePageSource).not.toContain('getProjectSlug');
    expect(homePageSource).not.toContain('Em Destaque');
  });

  it('does not render the join / comunidade CTA block pulled from layout.home.join', () => {
    expect(homePageSource).not.toContain('layout.home.join.title');
    expect(homePageSource).not.toContain('layout.home.join.description');
  });
});
