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
