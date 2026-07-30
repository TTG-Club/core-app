import type { GroupNode } from './types';

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
