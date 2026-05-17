/** Tipos de publicação disponíveis no CMS (alinha com `PublicationType` no Prisma). */
const knownPublicationTypes = new Set(['livro', 'artigo', 'relatorio', 'tese', 'documento']);

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
