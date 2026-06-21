/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const noticiasPageSource = readFileSync(resolve(process.cwd(), 'app/noticias/page.tsx'), 'utf8');

describe('noticias page layout', () => {
  it('uses compact responsive cards for the news listing', () => {
    expect(noticiasPageSource).toContain("import MotionReveal from '@/components/MotionReveal'");
    expect(noticiasPageSource).toContain('grid-cols-[repeat(auto-fit,minmax(240px,1fr))]');
    expect(noticiasPageSource).toContain('p-4');
    expect(noticiasPageSource).toContain('aspect-[4/3]');
    expect(noticiasPageSource).toContain('loading="lazy"');
    expect(noticiasPageSource).toContain('decoding="async"');
    expect(noticiasPageSource).toContain('text-lg');
    expect(noticiasPageSource).toContain('[-webkit-line-clamp:3]');
    expect(noticiasPageSource).toContain('<MotionReveal key={article.id} className="h-full" delayMs={index * 80}>');
    expect(noticiasPageSource).toContain('group-hover:scale-[1.035]');
    expect(noticiasPageSource).not.toContain('h-48 w-full');
    expect(noticiasPageSource).not.toContain('p-6 transition-all');
  });
});
