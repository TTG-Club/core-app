import type { GroupKey, GroupNode, GroupSortOrdered } from './types';

import { GROUPED_LIST_COLUMN_BREAKPOINTS } from './constants';

/** Строка списка с разделителем группы. */
export interface SeparatorRow {
  type: 'separator';
  key: string;
  label: string;
}

/** Строка списка с элементами: вся группа или одна строка виртуальной сетки. */
export interface ItemsRow<TItem> {
  type: 'items';
  key: string;
  items: Array<TItem>;
}

export type ListRow<TItem> = SeparatorRow | ItemsRow<TItem>;

/**
 * Разворачивает дерево групп в плоский список строк: разделитель узла, его
 * элементы, затем строки подгрупп.
 *
 * Узел без своих элементов разделителя не получает: он только объединяет
 * подгруппы, а их подписи и без него самодостаточны.
 *
 * @param nodes узлы одного уровня в порядке вывода.
 * @returns строки списка в порядке вывода.
 */
export function flattenGroupTree<TItem>(
  nodes: Array<GroupNode<TItem>>,
): Array<ListRow<TItem>> {
  return nodes.flatMap((node) => {
    const ownRows: Array<ListRow<TItem>> = node.items.length
      ? [
          {
            type: 'separator',
            key: `separator:${node.key}`,
            label: node.label,
          },
          { type: 'items', key: `items:${node.key}`, items: node.items },
        ]
      : [];

    return [...ownRows, ...flattenGroupTree(node.children)];
  });
}

/**
 * Возвращает количество колонок для текущей ширины контейнера.
 *
 * @param containerWidth ширина контейнера списка в пикселях.
 * @param maxColumns верхний предел колонок из пропа компонента.
 * @returns количество колонок по брейкпоинтам, не больше `maxColumns`.
 */
export function getColumnCount(
  containerWidth: number,
  maxColumns: number,
): number {
  return GROUPED_LIST_COLUMN_BREAKPOINTS.reduce((columnCount, breakpoint) => {
    if (containerWidth >= breakpoint.width) {
      return Math.min(breakpoint.columns, maxColumns);
    }

    return columnCount;
  }, 1);
}

/**
 * Приводит текстовый ключ группы к сравнимому виду: числовые строки становятся
 * числами, остальные остаются строками.
 *
 * @param rawKey исходный текстовый ключ группы.
 * @returns ключ для сортировки — число либо исходная строка.
 */
export function getComparableKey(rawKey: string): GroupKey {
  if (!rawKey.length) {
    return rawKey;
  }

  const numericKey = Number(rawKey);

  return Number.isNaN(numericKey) ? rawKey : numericKey;
}

/**
 * Сортирует ключи групп: числа по возрастанию, строки по алфавиту.
 *
 * @param keys ключи групп.
 * @returns новый отсортированный массив ключей.
 */
export function sortKeysAuto(keys: Array<GroupKey>): Array<GroupKey> {
  return [...keys].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return sortString(String(a), String(b));
  });
}

/**
 * Сортирует ключи групп по заданному порядку. Ключи вне порядка добавляются
 * до или после известных согласно `sortConfig.unknown`.
 *
 * @param keys ключи групп.
 * @param sortConfig порядок ключей и политика для неизвестных.
 * @returns новый отсортированный массив ключей.
 */
export function sortKeysOrdered(
  keys: Array<GroupKey>,
  sortConfig: GroupSortOrdered,
): Array<GroupKey> {
  const orderIndexByKeyText = new Map<string, number>();

  Array.from(sortConfig.order).forEach((key, index) => {
    orderIndexByKeyText.set(String(key), index);
  });

  const knownKeys: Array<GroupKey> = [];
  const unknownKeys: Array<GroupKey> = [];

  keys.forEach((key) => {
    if (orderIndexByKeyText.has(String(key))) {
      knownKeys.push(key);
    } else {
      unknownKeys.push(key);
    }
  });

  const sortedKnown = [...knownKeys].sort((a, b) => {
    const aIndex = orderIndexByKeyText.get(String(a));
    const bIndex = orderIndexByKeyText.get(String(b));

    if (aIndex === undefined && bIndex === undefined) {
      return 0;
    }

    if (aIndex === undefined) {
      return 1;
    }

    if (bIndex === undefined) {
      return -1;
    }

    return aIndex - bIndex;
  });

  const unknownPolicy = sortConfig.unknown ?? 'after';

  if (unknownPolicy === 'before') {
    return [...sortKeysAuto(unknownKeys), ...sortedKnown];
  }

  return [...sortedKnown, ...sortKeysAuto(unknownKeys)];
}

/**
 * Разбивает элементы на строки сетки по количеству колонок.
 *
 * @param sourceItems элементы одной группы.
 * @param columnsCount количество колонок сетки.
 * @returns строки сетки в исходном порядке элементов.
 */
export function chunkItems<TItem>(
  sourceItems: Array<TItem>,
  columnsCount: number,
): Array<Array<TItem>> {
  const chunks: Array<Array<TItem>> = [];

  for (
    let itemIndex = 0;
    itemIndex < sourceItems.length;
    itemIndex += columnsCount
  ) {
    chunks.push(sourceItems.slice(itemIndex, itemIndex + columnsCount));
  }

  return chunks;
}
