'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, ChevronLeft, ChevronRight, History } from 'lucide-react';

export type ActivityCalendarEntry = {
  /** Milissegundos UTC do instante de início (desde prisma `Date`). */
  startMs: number;
  href: string;
  title: string;
};

type Props = {
  entries: ActivityCalendarEntry[];
};

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

const getDayKey = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getEntryDate = (entry: ActivityCalendarEntry) => new Date(entry.startMs);

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  });

const getCalendarDays = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  const firstVisibleDay = new Date(firstDay);
  firstVisibleDay.setDate(firstDay.getDate() - mondayBasedOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return date;
  });
};

export default function ActivitiesMonthCalendar({ entries }: Props) {
  const router = useRouter();

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.startMs - b.startMs),
    [entries]
  );
  const firstEntryDate = sortedEntries[0] ? getEntryDate(sortedEntries[0]) : new Date();
  const lastEntryDate = sortedEntries.at(-1) ? getEntryDate(sortedEntries.at(-1)!) : firstEntryDate;
  const [visibleMonth, setVisibleMonth] = useState(
    () => getMonthStart(firstEntryDate)
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, ActivityCalendarEntry[]>();

    for (const event of sortedEntries) {
      const key = getDayKey(getEntryDate(event));
      const bucket = map.get(key) ?? [];
      bucket.push(event);
      map.set(key, bucket);
    }

    return map;
  }, [sortedEntries]);

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const handleDayActivated = useCallback(
    (clicked: Date) => {
      const key = getDayKey(clicked);
      const bucket = eventsByDay.get(key);

      if (!bucket?.length) {
        return;
      }

      router.push(bucket[0].href);
    },
    [eventsByDay, router]
  );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 text-stone-800">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Mês anterior"
          title="Mês anterior"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-stone-700 transition-colors hover:border-primary hover:text-primary"
          onClick={() =>
            setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-center font-display text-lg font-bold capitalize text-foreground">
          {getMonthLabel(visibleMonth)}
        </p>
        <button
          type="button"
          aria-label="Mês seguinte"
          title="Mês seguinte"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-stone-700 transition-colors hover:border-primary hover:text-primary"
          onClick={() =>
            setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 flex-1 basis-28 items-center justify-center gap-1 rounded-md border border-border bg-white px-3 text-xs font-medium text-stone-700 transition-colors hover:border-primary hover:text-primary"
          onClick={() => setVisibleMonth(getMonthStart(new Date()))}
        >
          Hoje
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 flex-1 basis-28 items-center justify-center gap-1 rounded-md border border-border bg-white px-3 text-xs font-medium text-stone-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={sortedEntries.length === 0}
          onClick={() => setVisibleMonth(getMonthStart(firstEntryDate))}
        >
          <History className="h-3.5 w-3.5" />
          <span>Mais antigo</span>
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 flex-1 basis-28 items-center justify-center gap-1 rounded-md border border-border bg-white px-3 text-xs font-medium text-stone-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={sortedEntries.length === 0}
          onClick={() => setVisibleMonth(getMonthStart(lastEntryDate))}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span>Última data</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground">
        {weekdays.map((weekday) => (
          <span key={weekday} className="py-2">
            {weekday}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayEvents = eventsByDay.get(getDayKey(day)) ?? [];
          const hasActivities = dayEvents.length > 0;
          const isVisibleMonth = day.getMonth() === visibleMonth.getMonth();
          const dayLabel = hasActivities
            ? `${day.getDate()}: ${dayEvents.map((event) => event.title).join(', ')}`
            : `${day.getDate()}`;

          return (
            <button
              key={day.toISOString()}
              type="button"
              aria-label={dayLabel}
              title={hasActivities ? dayEvents.map((event) => event.title).join(', ') : undefined}
              disabled={!hasActivities}
              className={`aspect-square rounded-md text-sm transition-colors ${
                hasActivities
                  ? 'bg-[#eef4ea] font-semibold text-[#27441d] hover:bg-[#dfead7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                  : 'cursor-default text-stone-400 disabled:opacity-100'
              } ${isVisibleMonth ? '' : 'opacity-45'}`}
              onClick={() => handleDayActivated(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
