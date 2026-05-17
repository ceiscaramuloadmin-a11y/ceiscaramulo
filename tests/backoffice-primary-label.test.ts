import { describe, expect, it } from 'vitest';
import { backofficePrimaryActionLabel } from '@/lib/backoffice-primary-label';

describe('backofficePrimaryActionLabel', () => {
  it('mostra mensagem de espera quando busy', () => {
    expect(backofficePrimaryActionLabel(true, 'Guardar layout')).toBe('A guardar…');
  });

  it('mantém o rótulo em idle', () => {
    expect(backofficePrimaryActionLabel(false, 'Criar notícia')).toBe('Criar notícia');
  });
});
