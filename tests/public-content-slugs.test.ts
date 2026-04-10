import { describe, expect, it } from 'vitest';
import { getActivitySlug, getProjectSlug, getPublicationSlug } from '@/lib/public-content-slugs';

describe('public-content-slugs', () => {
  it('creates stable slugs from accented titles', () => {
    expect(getActivitySlug({ id: '1', title: 'Caminhada à Serra do Caramulo' })).toBe('caminhada-a-serra-do-caramulo');
    expect(getProjectSlug({ id: '2', title: 'Água & Floresta' })).toBe('agua-floresta');
    expect(getPublicationSlug({ id: '3', title: '   ' })).toBe('3');
  });
});
