import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('public-db-guard', () => {
  it('recognizes database quota exceeded errors', async () => {
    const { isPublicDbQuotaExceededError } = await import('@/lib/public-db-guard');
    expect(isPublicDbQuotaExceededError(new Error('Your project has exceeded the data transfer quota'))).toBe(true);
    expect(isPublicDbQuotaExceededError(new Error('random failure'))).toBe(false);
  });

  it('marks the public db as unavailable for a retry window', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { markPublicDbQuotaExceeded, shouldSkipPublicDb } = await import('@/lib/public-db-guard');

    expect(shouldSkipPublicDb()).toBe(false);
    markPublicDbQuotaExceeded('home page');
    expect(shouldSkipPublicDb()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
