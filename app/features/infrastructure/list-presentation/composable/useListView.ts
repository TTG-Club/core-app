import type { ComputedRef } from 'vue';

import {
  LIST_VIEW_OPTIONS,
  LIST_VIEW_ROWS_COLUMNS,
  LIST_VIEW_STORAGE_KEY,
} from '../model';

/** Вид списка: карточками или строками. */
export type ListView = (typeof LIST_VIEW_OPTIONS)[number]['value'];

export interface UseListViewReturn {
  /** Выбранный вид */
  view: ComputedRef<ListView>;
  /** Наибольшее число колонок списка; нет — сколько поместится */
  columns: ComputedRef<typeof LIST_VIEW_ROWS_COLUMNS | undefined>;
  /** Выбраны ли строки: карточки с обложкой тогда тоже рисуются строкой */
  isRows: ComputedRef<boolean>;
  /** Меняет вид списка */
  setView: (value: ListView) => void;
}

/**
 * Проверяет, что сохранённое значение — известный вид списка.
 *
 * @param value Значение из хранилища.
 * @returns Вид списка; неизвестное значение — `undefined`.
 */
function findListView(value: unknown): ListView | undefined {
  return LIST_VIEW_OPTIONS.find((option) => option.value === value)?.value;
}

/**
 * Вид списков разделов: карточками в несколько колонок или строками, где
 * длинные названия не обрезаются. Один на все разделы, выбирается в
 * шестерёнке рядом с темой и шириной сайта.
 *
 * Хранилище читается после монтирования: сервер не знает выбор и рисует
 * карточки, а без этого клиент разошёлся бы с ним при гидратации.
 *
 * @returns Выбранный вид, число колонок, признак строк и смена вида.
 */
export function useListView(): UseListViewReturn {
  const storedView = useLocalStorage<string>(
    LIST_VIEW_STORAGE_KEY,
    LIST_VIEW_OPTIONS[0].value,
    { initOnMounted: true },
  );

  const view = computed<ListView>(
    () => findListView(storedView.value) ?? LIST_VIEW_OPTIONS[0].value,
  );

  const isRows = computed(() => view.value === 'rows');

  const columns = computed(() =>
    isRows.value ? LIST_VIEW_ROWS_COLUMNS : undefined,
  );

  /**
   * Запоминает вид списка.
   *
   * @param value Новый вид.
   */
  function setView(value: ListView): void {
    storedView.value = value;
  }

  return { view, columns, isRows, setView };
}
