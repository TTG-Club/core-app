/**
 * Пересдвигает набор индексов после удаления строки списка.
 *
 * Нужен спискам, у которых состояние строки (раскрыта, показано описание)
 * хранится по её номеру: без сдвига после удаления раскрытым оказался бы сосед,
 * занявший освободившийся индекс.
 *
 * @param indexes набор индексов строк.
 * @param removed индекс удалённой строки.
 * @returns новый набор без удалённой строки и со сдвинутыми следующими.
 */
export function shiftIndexesAfterRemoval(
  indexes: Set<number>,
  removed: number,
): Set<number> {
  return new Set(
    [...indexes]
      .filter((position) => position !== removed)
      .map((position) => (position > removed ? position - 1 : position)),
  );
}
