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
    expect(pageSource).toContain('lg:grid-cols-[minmax(0,1fr)_20rem]');
    expect(pageSource).toContain('lg:sticky lg:top-28');
    expect(pageSource).toContain("orderBy: [{ createdAt: 'desc' }, { date: 'desc' }]");
  });

  it('keeps the homepage activities section simple and calendar-free', () => {
    expect(homeSource).not.toContain('ActivitiesMonthCalendar');
    expect(homeSource).not.toContain('Calendário de atividades na página inicial');
    expect(homeSource).not.toContain('Próximas');
    expect(homeSource).toContain("orderBy: [{ createdAt: 'desc' }, { date: 'desc' }]");
    expect(homeSource).toContain('take: 6');
  });
});
