/** Значки кнопки свёртки: куда уедет содержимое строки при нажатии. */
const TOGGLE_ICONS = {
  expanded: 'tabler:chevron-up',
  collapsed: 'tabler:chevron-down',
} as const;

/**
 * Свёрнутые строки списка, состояние которых хранится по их номеру: умения
 * класса, варианты умения, особенности вида.
 *
 * Свой набор раскрытых строк, а не аккордеон: кнопка удаления обязана лежать
 * РЯДОМ с раскрывающим триггером, а не внутри него, иначе удалить строку можно
 * было бы только развернув её.
 *
 * @returns действия над набором раскрытых строк.
 *
 * @example
 * const { isExpanded, toggle, getToggleIcon, expand, dropRow } =
 *   useExpandedRows();
 */
export function useExpandedRows() {
  const expanded = ref<Set<number>>(new Set());

  /**
   * Раскрыта ли строка.
   *
   * @param index позиция строки в списке.
   * @returns `true`, когда тело строки развёрнуто.
   */
  function isExpanded(index: number): boolean {
    return expanded.value.has(index);
  }

  /**
   * Разворачивает или сворачивает строку.
   *
   * @param index позиция строки в списке.
   */
  function toggle(index: number): void {
    const next = new Set(expanded.value);

    if (!next.delete(index)) {
      next.add(index);
    }

    expanded.value = next;
  }

  /**
   * Раскрывает строку. Нужен только что добавленной: свёрнутой она легла бы в
   * список пустой безымянной плашкой.
   *
   * @param index позиция строки в списке.
   */
  function expand(index: number): void {
    expanded.value = new Set([...expanded.value, index]);
  }

  /**
   * Убирает строку из набора и сдвигает следующие: без сдвига раскрытым
   * оказался бы сосед, занявший освободившийся номер.
   *
   * @param index позиция удалённой строки.
   */
  function dropRow(index: number): void {
    expanded.value = shiftIndexesAfterRemoval(expanded.value, index);
  }

  /**
   * Значок кнопки свёртки. Функцией, а не вычисляемым свойством: состояние
   * своё у каждой строки списка.
   *
   * @param index позиция строки в списке.
   * @returns имя значка.
   */
  function getToggleIcon(index: number): string {
    return isExpanded(index) ? TOGGLE_ICONS.expanded : TOGGLE_ICONS.collapsed;
  }

  return { isExpanded, toggle, expand, dropRow, getToggleIcon };
}
