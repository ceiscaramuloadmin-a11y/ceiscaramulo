/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const contactPageSource = readFileSync(resolve(process.cwd(), 'app/contactos/page.tsx'), 'utf8');
const contactFormSource = readFileSync(resolve(process.cwd(), 'components/ContactForm.tsx'), 'utf8');

describe('contact page', () => {
  it('renders the requested institutional contact information', () => {
    expect(contactPageSource).toContain('Prof. Luís Costa');
    expect(contactPageSource).toContain('966717360');
    expect(contactPageSource).toContain('ceiscaramulo@gmail.com');
  });

  it('includes a public contact form with the required fields', () => {
    expect(contactFormSource).toContain('Nome');
    expect(contactFormSource).toContain('Email');
    expect(contactFormSource).toContain('Assunto');
    expect(contactFormSource).toContain('Mensagem');
    expect(contactFormSource).toContain("fetch('/api/contact-messages'");
  });
});
