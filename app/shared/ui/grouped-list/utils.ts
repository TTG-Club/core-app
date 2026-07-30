import type { GroupNode } from './types';

import {
  GROUPED_LIST_SEPARATOR_INDENT_CLASSES,
  GROUPED_LIST_SEPARATOR_LABEL_CLASSES,
} from './constants';

/** Строка списка с разделителем группы. */
export interface SeparatorRow {
  type: 'separator';
  key: string;
  label: string;
  level: number;
}

/** Строка списка с элементами: вся группа или одна строка виртуальной сетки. */
export interface ItemsRow<TItem> {
  type: 'items';
  key: string;
  items: Array<TItem>;
}

export type ListRow<TItem> = SeparatorRow | ItemsRow<TItem>;

/**
 * Возвращает классы подписи разделителя по уровню вложенности группы.
 *
 * @param level уровень вложенности, `0` — корень.
 * @returns классы подписи; глубже последнего уровня подпись не мельчает.
 */
export function getSeparatorLabelClass(level: number): string {
  const lastIndex = GROUPED_LIST_SEPARATOR_LABEL_CLASSES.length - 1;

  return GROUPED_LIST_SEPARATOR_LABEL_CLASSES[Math.min(level, lastIndex)] ?? '';
}

/**
 * Возвращает отступ разделителя по уровню вложенности группы.
 *
 * @param level уровень вложенности, `0` — корень.
 * @returns классы отступа; глубже последнего уровня отступ не растёт.
 */
export function getSeparatorIndentClass(level: number): string {
  const lastIndex = GROUPED_LIST_SEPARATOR_INDENT_CLASSES.length - 1;

  return (
    GROUPED_LIST_SEPARATOR_INDENT_CLASSES[Math.min(level, lastIndex)] ?? ''
  );
}

/**
 * Разворачивает дерево групп в плоский список строк: разделитель узла, затем
 * его собственные элементы, затем строки подгрупп. Пустые узлы дерево не
 * отдаёт, поэтому фильтрация здесь не нужна.
 *
 * @param nodes узлы одного уровня в порядке вывода.
 * @param level уровень вложенности переданных узлов, `0` — корень.
 * @returns строки списка в порядке вывода.
 */
export function flattenGroupTree<TItem>(
  nodes: Array<GroupNode<TItem>>,
  level: number,
): Array<ListRow<TItem>> {
  return nodes.flatMap((node) => {
    const separatorRow: SeparatorRow = {
      type: 'separator',
      key: `separator:${node.key}`,
      label: node.label,
      level,
    };

    const itemsRows: Array<ListRow<TItem>> = node.items.length
      ? [{ type: 'items', key: `items:${node.key}`, items: node.items }]
      : [];

    return [
      separatorRow,
      ...itemsRows,
      ...flattenGroupTree(node.children, level + 1),
    ];
  });
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
