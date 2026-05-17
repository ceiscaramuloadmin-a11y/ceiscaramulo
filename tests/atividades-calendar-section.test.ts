/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('activities calendar section', () => {
  const pageSource = readFileSync(resolve(process.cwd(), 'app/atividades/page.tsx'), 'utf8');
  const homeSource = readFileSync(resolve(process.cwd(), 'app/page.tsx'), 'utf8');

  it('mounts an interactive picker backed by prisma rows', () => {
    expect(pageSource).toContain('ActivitiesMonthCalendar');
    expect(pageSource).toContain('startMs');
    expect(pageSource).toContain('/atividades/${getActivitySlug(activity)}');
    expect(pageSource).toContain('Mapa rápido de datas');
  });

  it('mounts the activities calendar on the homepage', () => {
    expect(homeSource).toContain('ActivitiesMonthCalendar');
    expect(homeSource).toContain('Calendário de atividades na página inicial');
    expect(homeSource).toContain('Datas no calendário');
    expect(homeSource.indexOf('Calendário de atividades na página inicial')).toBeLessThan(
      homeSource.indexOf('{activities.map((activity) => (')
    );
  });
});
