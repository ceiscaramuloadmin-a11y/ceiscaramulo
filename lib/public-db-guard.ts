const PUBLIC_DB_RETRY_DELAY_MS = 5 * 60 * 1000;

let publicDbRetryAfter = 0;
let hasLoggedQuotaWarning = false;

export function shouldSkipPublicDb() {
  return publicDbRetryAfter > Date.now();
}

export function isPublicDbQuotaExceededError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    String((error as { message?: string }).message || '').includes('exceeded the data transfer quota')
  );
}

export function markPublicDbQuotaExceeded(context: string) {
  publicDbRetryAfter = Date.now() + PUBLIC_DB_RETRY_DELAY_MS;

  if (!hasLoggedQuotaWarning) {
    hasLoggedQuotaWarning = true;
    console.warn(`Neon quota exceeded while loading ${context}; using static public fallback data.`);
  }
}
