/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('newsletter page', () => {
  const source = readFileSync(resolve(process.cwd(), 'app/newsletter/page.tsx'), 'utf8');

  it('renders a dedicated public form for newsletter intentions', () => {
    expect(source).toContain('Newsletter CEISCaramulo');
    expect(source).toContain('Receber noticias e atividades');
    expect(source).toContain('<NewsletterIntentForm />');
  });
});
