/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultSiteLayoutSettings } from '@/lib/site-layout';

const contactPageSource = readFileSync(resolve(process.cwd(), 'app/contactos/page.tsx'), 'utf8');
const contactFormSource = readFileSync(resolve(process.cwd(), 'components/ContactForm.tsx'), 'utf8');

describe('contact page', () => {
  it('renders the requested institutional contact information', () => {
    expect(defaultSiteLayoutSettings.pages.contactos.presidentName).toBe('Prof. Luís Costa');
    expect(defaultSiteLayoutSettings.pages.contactos.phone).toBe('966717360');
    expect(defaultSiteLayoutSettings.pages.contactos.email).toBe('ceiscaramulo@gmail.com');
    expect(contactPageSource).toContain('contactPage.presidentName');
    expect(contactPageSource).toContain('contactPage.phone');
    expect(contactPageSource).toContain('contactPage.email');
  });

  it('includes a public contact form with the required fields', () => {
    expect(contactFormSource).toContain('Nome');
    expect(contactFormSource).toContain('Email');
    expect(contactFormSource).toContain('Assunto');
    expect(contactFormSource).toContain('Mensagem');
    expect(contactFormSource).toContain("fetch('/api/contact-messages'");
  });
});
