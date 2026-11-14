import type { ComputedRef } from 'vue';

import {
  LIST_VIEW_DEFAULT,
  LIST_VIEW_OPTIONS,
  LIST_VIEW_STORAGE_KEY,
} from '../model';

type ListViewOption = (typeof LIST_VIEW_OPTIONS)[number];

/** Вид списка: карточками до двух, трёх или четырёх колонок либо строками. */
export type ListView = ListViewOption['value'];

/** Наибольшее число колонок списка. */
export type ListColumnCount = ListViewOption['columns'];

export interface UseListViewReturn {
  /** Выбранный вид */
  view: ComputedRef<ListView>;
  /** Наибольшее число колонок: меньше, если столько не помещается */
  columns: ComputedRef<ListColumnCount>;
  /** Выбраны ли строки: карточки с обложкой тогда тоже рисуются строкой */
  isRows: ComputedRef<boolean>;
  /** Меняет вид списка */
  setView: (value: ListView) => void;
}

/**
 * Находит вид списка по сохранённому значению.
 *
 * @param value Значение из хранилища.
 * @returns Вид; неизвестное значение (в том числе прежнее `grid`) — вид по
 *   умолчанию.
 */
function findListViewOption(value: unknown): ListViewOption {
  return (
    LIST_VIEW_OPTIONS.find((option) => option.value === value)
    ?? LIST_VIEW_OPTIONS.find((option) => option.value === LIST_VIEW_DEFAULT)
    ?? LIST_VIEW_OPTIONS[0]
  );
}

/**
 * Читает выбранный вид списка прямо из хранилища браузера — для тех, кому
 * нужен ответ сразу, а не после монтирования (учёт онлайна).
 *
 * @returns Вид; без хранилища или без выбора — вид по умолчанию.
 */
export function readStoredListView(): ListView {
  try {
    return findListViewOption(localStorage.getItem(LIST_VIEW_STORAGE_KEY))
      .value;
  } catch {
    return findListViewOption(null).value;
  }
}

/**
 * Вид списков разделов: карточками — не больше выбранного числа колонок и не
 * больше, чем помещается по ширине, — или строками, где длинные названия не
 * обрезаются. Один на все разделы, выбирается в шестерёнке рядом с темой и
 * шириной сайта.
 *
 * Хранилище читается после монтирования: сервер не знает выбор и рисует вид
 * по умолчанию, а без этого клиент разошёлся бы с ним при гидратации.
 *
 * @returns Выбранный вид, число колонок, признак строк и смена вида.
 */
export function useListView(): UseListViewReturn {
  const storedView = useLocalStorage<string>(
    LIST_VIEW_STORAGE_KEY,
    LIST_VIEW_DEFAULT,
    { initOnMounted: true },
  );

  const option = computed(() => findListViewOption(storedView.value));

  const view = computed(() => option.value.value);

  const columns = computed(() => option.value.columns);

  const isRows = computed(() => view.value === 'rows');

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
