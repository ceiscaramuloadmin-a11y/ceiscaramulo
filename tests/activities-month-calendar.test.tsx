import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ActivitiesMonthCalendar from '@/components/activities/ActivitiesMonthCalendar';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));
});

afterEach(() => {
  cleanup();
  push.mockClear();
  vi.useRealTimers();
});

describe('ActivitiesMonthCalendar', () => {
  it('opens on the current month and can navigate to an activity month', () => {
    render(
      <ActivitiesMonthCalendar
        entries={[
          {
            startMs: new Date('2026-02-15T10:00:00.000Z').getTime(),
            href: '/atividades/caminhada-no-caramulo',
            title: 'Caminhada no Caramulo',
          },
        ]}
      />
    );

    expect(
      screen.getByText(new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }))
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mais antigo/i }));
    expect(screen.getByText(/fevereiro de 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /15: Caminhada no Caramulo/i }));

    expect(push).toHaveBeenCalledWith('/atividades/caminhada-no-caramulo');
  });

  it('keeps empty days inert', () => {
    render(
      <ActivitiesMonthCalendar
        entries={[
          {
            startMs: new Date('2026-02-15T10:00:00.000Z').getTime(),
            href: '/atividades/caminhada-no-caramulo',
            title: 'Caminhada no Caramulo',
          },
        ]}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: '10' })[0]);

    expect(push).not.toHaveBeenCalled();
  });

  it('jumps between today, the oldest activity and the latest activity', () => {
    render(
      <ActivitiesMonthCalendar
        entries={[
          {
            startMs: new Date('2026-01-04T10:00:00.000Z').getTime(),
            href: '/atividades/mais-antiga',
            title: 'Atividade mais antiga',
          },
          {
            startMs: new Date('2026-03-20T10:00:00.000Z').getTime(),
            href: '/atividades/ultima-data',
            title: 'Atividade última data',
          },
        ]}
      />
    );

    expect(
      screen.getByText(new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }))
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mais antigo/i }));
    expect(screen.getByText(/janeiro de 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Última data/i }));
    expect(screen.getByText(/março de 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Hoje/i }));
    expect(screen.getAllByText(/junho de 2026/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Hoje: 8 de junho de 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hoje, 8 de junho de 2026' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mais antigo/i }));
    expect(screen.getByText(/janeiro de 2026/i)).toBeInTheDocument();
  });

  it('moves to the previous and next month without navigating to an activity', () => {
    render(
      <ActivitiesMonthCalendar
        entries={[
          {
            startMs: new Date('2026-02-15T10:00:00.000Z').getTime(),
            href: '/atividades/caminhada-no-caramulo',
            title: 'Caminhada no Caramulo',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Mais antigo/i }));
    expect(screen.getByText(/fevereiro de 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mês anterior/i }));
    expect(screen.getByText(/janeiro de 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mês seguinte/i }));
    expect(screen.getByText(/fevereiro de 2026/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
