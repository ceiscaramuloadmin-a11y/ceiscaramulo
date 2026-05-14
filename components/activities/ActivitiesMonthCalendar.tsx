'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { startOfDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { pt } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

export type ActivityCalendarEntry = {
  /** Milissegundos UTC do instante de início (desde prisma `Date`). */
  startMs: number;
  href: string;
  title: string;
};

type Props = {
  entries: ActivityCalendarEntry[];
};

export default function ActivitiesMonthCalendar({ entries }: Props) {
  const router = useRouter();

  /** Um `Date` por dia civil local (fusos do navegador) para pintar todas as sessões sobre o mesmo dia. */
  const daysMarked = useMemo(() => {
    const uniqueTimes = [...new Set(entries.map((event) => startOfDay(new Date(event.startMs)).getTime()))];
    uniqueTimes.sort((a, b) => a - b);
    return uniqueTimes.map((ts) => new Date(ts));
  }, [entries]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, ActivityCalendarEntry[]>();

    for (const event of entries) {
      const key = startOfDay(new Date(event.startMs)).getTime();
      const bucket = map.get(key) ?? [];
      bucket.push(event);
      map.set(key, bucket);
    }

    return map;
  }, [entries]);

  const handleDayActivated = useCallback(
    (clicked: Date) => {
      const key = startOfDay(clicked).getTime();
      const bucket = eventsByDay.get(key);

      if (!bucket?.length) {
        return;
      }

      router.push(bucket[0].href);
    },
    [eventsByDay, router]
  );

  return (
    <div className="activities-calendar mx-auto flex w-full max-w-lg flex-col items-center gap-6 [&_.rdp]:text-stone-800">
      <DayPicker
        locale={pt}
        weekStartsOn={1}
        modifiers={{ hasActivities: daysMarked }}
        modifiersClassNames={{
          hasActivities:
            '!bg-[#eef4ea] font-semibold text-[#27441d] [&>button]:rounded-md [&:not(button)]:rounded-md',
        }}
        onDayClick={(day, _activeModifiers, event) => {
          event.preventDefault();
          handleDayActivated(day);
        }}
      />
      <style jsx global>{`
        .activities-calendar .rdp-root {
          --rdp-accent-color: #27441d;
        }
      `}</style>
    </div>
  );
}
