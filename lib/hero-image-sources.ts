/**
 * Converte o campo texto `hero.imageUrl` das definições de layout numa lista de URLs públicas.
 * - `data:` continua inteiro (evita partir strings Base64 gigantes pelo carácter `|`).
 * - Vários URLs usam `|` porque o modelo de dados do backoffice já persiste só um texto longo.
 */
export function splitHeroImageSources(raw: string): string[] {
  const trimmed = (raw || '').trim();

  if (!trimmed) {
    return ['/placeholder.svg'];
  }

  if (trimmed.startsWith('data:')) {
    return [trimmed];
  }

  const segments = trimmed
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  return segments.length > 0 ? segments : ['/placeholder.svg'];
}
