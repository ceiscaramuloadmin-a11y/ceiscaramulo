import { describe, expect, it } from 'vitest';
import {
  bibliotecaPublicationTypes,
  filterBibliotecaByQuery,
  filterBibliotecaByTipo,
  parseBibliotecaQueryParam,
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

describe('filterBibliotecaByQuery', () => {
  const items = [
    { title: 'Arquivo do Burel', author: 'CEIS', year: 2025, type: 'documento', description: '<p>Oficina e saberes locais</p>' },
    { title: 'Flora da Serra', author: 'Maria Silva', year: 2024, type: 'livro', description: 'Guia de campo' },
  ];

  it('pesquisa por titulo, autor, ano, tipo e descricao sem depender de acentos', () => {
    expect(filterBibliotecaByQuery(items, 'burel')).toEqual([items[0]]);
    expect(filterBibliotecaByQuery(items, 'maria')).toEqual([items[1]]);
    expect(filterBibliotecaByQuery(items, '2025')).toEqual([items[0]]);
    expect(filterBibliotecaByQuery(items, 'descrição inexistente')).toEqual([]);
    expect(filterBibliotecaByQuery(items, 'oficina')).toEqual([items[0]]);
  });

  it('mantem todos os recursos quando a pesquisa esta vazia', () => {
    expect(filterBibliotecaByQuery(items, '   ')).toEqual(items);
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

describe('parseBibliotecaQueryParam', () => {
  it('normaliza espacos e limita pesquisas demasiado longas', () => {
    expect(parseBibliotecaQueryParam(undefined)).toBe('');
    expect(parseBibliotecaQueryParam(['  flora   caramulo  '])).toBe('flora caramulo');
    expect(parseBibliotecaQueryParam('x'.repeat(100))).toHaveLength(80);
  });
});
