/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cmsSource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');

describe('cms section configuration', () => {
  it('orders activities by newest created records first with event date as fallback', () => {
    expect(cmsSource).toContain("listOrder: [{ createdAt: 'desc' }, { date: 'desc' }]");
  });
});
