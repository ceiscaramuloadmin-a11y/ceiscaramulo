/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sobreNosPageSource = readFileSync(resolve(process.cwd(), 'app/sobre-nos/page.tsx'), 'utf8');
const serraPageSource = readFileSync(resolve(process.cwd(), 'app/serra-do-caramulo/page.tsx'), 'utf8');
const backofficePageSource = readFileSync(resolve(process.cwd(), 'app/backoffice/page.tsx'), 'utf8');

describe('institutional pages', () => {
  it('renders the updated CEISCaramulo institutional history and social bodies on sobre nós', () => {
    expect(sobreNosPageSource).toContain('associação legalmente constituída');
    expect(sobreNosPageSource).toContain('Prémio Escolar Montepio 2011');
    expect(sobreNosPageSource).toContain('Mesa da Assembleia Geral');
    expect(sobreNosPageSource).toContain('Direção');
    expect(sobreNosPageSource).toContain('Conselho Fiscal');
    expect(sobreNosPageSource).toContain('Luís Filipe Rodrigues da Costa');
  });

  it('embeds only the GeologiaCaramulo pdf inside the Serra do Caramulo page container', () => {
    expect(serraPageSource).toContain("const pdfUrl = '/api/docs/geologia-caramulo'");
    expect(serraPageSource).toContain('<iframe');
    expect(serraPageSource).toContain('Preview do documento GeologiaCaramulo');
    expect(serraPageSource).not.toContain('layout.serra.sections.map');
  });

  it('allows the logged-in admin to change their own password from the overview', () => {
    expect(backofficePageSource).toContain('Segurança da conta');
    expect(backofficePageSource).toContain('Nova palavra-passe');
    expect(backofficePageSource).toContain('Confirmar nova palavra-passe');
    expect(backofficePageSource).toContain("fetchAdminEndpoint<{ success: boolean }>('/api/admin/password'");
  });
});
