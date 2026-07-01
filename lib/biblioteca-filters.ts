/** Tipos de publicação disponíveis no CMS (alinha com `PublicationType` no Prisma). */
const knownPublicationTypes = new Set(['livro', 'artigo', 'relatorio', 'tese', 'documento']);

type BibliotecaSearchablePublication = {
  title?: string | null;
  author?: string | null;
  year?: number | string | null;
  type?: string | null;
  description?: string | null;
};

function normalizeBibliotecaSearchText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function bibliotecaPublicationTypes(publications: ReadonlyArray<{ type: string }>): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const p of publications) {
    if (!knownPublicationTypes.has(p.type)) {
      continue;
    }
    if (seen.has(p.type)) continue;
    seen.add(p.type);
    ordered.push(p.type);
  }

  return ordered.sort((a, b) => a.localeCompare(b, 'pt'));
}

export function filterBibliotecaByTipo<T extends { type: string }>(
  publications: ReadonlyArray<T>,
  tipo: string | null,
): T[] {
  if (!tipo) {
    return [...publications];
  }

  return publications.filter((p) => p.type === tipo);
}

export function filterBibliotecaByQuery<T extends BibliotecaSearchablePublication>(
  publications: ReadonlyArray<T>,
  query: string,
): T[] {
  const normalizedQuery = normalizeBibliotecaSearchText(query);

  if (!normalizedQuery) {
    return [...publications];
  }

  return publications.filter((publication) => {
    const searchableText = normalizeBibliotecaSearchText([
      publication.title,
      publication.author,
      publication.year,
      publication.type,
      publication.description,
    ].join(' '));

    return searchableText.includes(normalizedQuery);
  });
}

export function parseBibliotecaTipoParam(
  raw: string | string[] | undefined,
  allowedDistinct: readonly string[],
): string | null {
  if (Array.isArray(raw)) {
    raw = raw[0];
  }

  if (!raw?.trim()) {
    return null;
  }

  const candidate = raw.trim().toLowerCase();
  const allowed = new Set(allowedDistinct);

  return allowed.has(candidate) ? candidate : null;
}

export function parseBibliotecaQueryParam(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) {
    raw = raw[0];
  }

  return String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
}
