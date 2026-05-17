import { describe, expect, it } from 'vitest';
import {
  bibliotecaPublicationTypes,
  filterBibliotecaByTipo,
  parseBibliotecaTipoParam,
} from '@/lib/biblioteca-filters';

describe('bibliotecaPublicationTypes', () => {
  it('lista tipos únicos conhecidos por ordem lexical', () => {
    expect(
      bibliotecaPublicationTypes([
        { type: 'tese' },
        { type: 'livro' },
        { type: 'livro' },
        { type: 'artigo' },
      ]),
    ).toEqual(['artigo', 'livro', 'tese']);
  });

  it('ignora tipos desconhecidos', () => {
    expect(bibliotecaPublicationTypes([{ type: 'livro' }, { type: 'invalido' }])).toEqual(['livro']);
  });
});

describe('filterBibliotecaByTipo', () => {
  it('mantém todas quando tipo é null', () => {
    const items = [{ type: 'livro', id: '1' }, { type: 'tese', id: '2' }];
    expect(filterBibliotecaByTipo(items, null)).toEqual(items);
  });

  it('filtra pelo tipo quando definido', () => {
    const items = [
      { type: 'livro', id: '1' },
      { type: 'tese', id: '2' },
      { type: 'livro', id: '3' },
    ];
    expect(filterBibliotecaByTipo(items, 'livro')).toEqual([
      { type: 'livro', id: '1' },
      { type: 'livro', id: '3' },
    ]);
  });
});

describe('parseBibliotecaTipoParam', () => {
  it('aceita apenas valores presentes na lista permitida', () => {
    const allowed = ['livro', 'tese'];
    expect(parseBibliotecaTipoParam(undefined, allowed)).toBe(null);
    expect(parseBibliotecaTipoParam('', allowed)).toBe(null);
    expect(parseBibliotecaTipoParam('LIVRO', allowed)).toBe('livro');
    expect(parseBibliotecaTipoParam(['tese'], allowed)).toBe('tese');
    expect(parseBibliotecaTipoParam('artigo', allowed)).toBe(null);
  });
});
