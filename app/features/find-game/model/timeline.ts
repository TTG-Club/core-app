import type { GameSession } from './types';

import { SESSION_AGENDA_LABELS } from './constants';

/** Относит встречу к календарному периоду в часовом поясе пользователя. */
function getAgendaPeriod(
  startsAt: string | null,
  dayStart: number,
  nextDayStart: number,
  nextWeekStart: number,
): keyof typeof SESSION_AGENDA_LABELS {
  const timestamp = startsAt ? Date.parse(startsAt) : Number.NaN;

  if (!Number.isFinite(timestamp)) {
    return 'unscheduled';
  }

  if (timestamp < dayStart) {
    return 'past';
  }

  if (timestamp < nextDayStart) {
    return 'today';
  }

  if (timestamp < nextWeekStart) {
    return 'week';
  }

  return 'later';
}

/** Группирует встречи по времени, не изменяя исходный массив. */
export function groupSessionsByPeriod(
  sessions: ReadonlyArray<GameSession>,
  dayStart: number,
  nextDayStart: number,
  nextWeekStart: number,
): Array<{ key: string; label: string; sessions: Array<GameSession> }> {
  const sorted = [...sessions].sort(
    (left, right) =>
      (left.startsAt ? Date.parse(left.startsAt) : Infinity)
      - (right.startsAt ? Date.parse(right.startsAt) : Infinity),
  );

  return Object.entries(SESSION_AGENDA_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      sessions: sorted.filter(
        (session) =>
          getAgendaPeriod(
            session.startsAt,
            dayStart,
            nextDayStart,
            nextWeekStart,
          ) === key,
      ),
    }))
    .filter((group) => group.sessions.length);
}

/**
 * Выбор периода расписания.
 *
 * Календарь остаётся за компонентом, у которого есть настроенный `dayjs`;
 * сюда приходят уже готовые метки времени.
 */

/**
 * Ближайший к точке отсчёта момент.
 *
 * Будущее важнее прошлого: расписание открывают ради того, что впереди, — и
 * прошедшее берётся, только когда впереди уже ничего нет.
 *
 * @param moments Моменты времени в любом порядке.
 * @param from Точка отсчёта.
 * @returns Ближайший момент или `null`, если список пуст.
 */
export function findNearestMoment(
  moments: ReadonlyArray<number>,
  from: number,
): number | null {
  const upcoming = moments.filter((moment) => moment >= from);
  const pool = upcoming.length ? upcoming : moments;

  return pool.reduce<number | null>(
    (nearest, moment) =>
      nearest === null || Math.abs(moment - from) < Math.abs(nearest - from)
        ? moment
        : nearest,
    null,
  );
}
