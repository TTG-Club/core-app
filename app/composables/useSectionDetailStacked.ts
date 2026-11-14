import type { ComputedRef } from 'vue';

import { useSectionCentered } from './useSectionCentered';

/**
 * Нужно ли ставить колонки карточки столбиком.
 *
 * В узкой раскладке «список и запись рядом» запись получает 800–900 px:
 * колонки рядом там тесные, а широкая таблица класса не помещается. Поэтому
 * в ней карточки с большими таблицами показываются как в узком контейнере —
 * свойства сверху, текст во всю ширину. Развёрнутой на всю колонку записи
 * места хватает, там колонки снова рядом.
 *
 * @returns Признак раскладки столбиком.
 */
export function useSectionDetailStacked(): ComputedRef<boolean> {
  const { isCenteredInSplit, isDetailExpanded } = useSectionCentered();

  return computed(() => isCenteredInSplit.value && !isDetailExpanded.value);
}
