export type GroupKey = string | number;

export type SeparatorLabel = string | ((value: GroupKey) => string);

export interface Group<TItem> {
  key: GroupKey;
  items: Array<TItem>;
}

export interface GroupSortAuto {
  mode: 'auto';
}

export interface GroupSortOrdered {
  mode: 'ordered';
  order: Set<GroupKey>;
  unknown?: 'after' | 'before' | 'auto';
}

export interface GroupSortComparator {
  mode: 'comparator';
  compare: (firstKey: GroupKey, secondKey: GroupKey) => number;
}

export interface GroupSortCustom<TItem> {
  mode: 'custom';
  compare: (items: Array<TItem>) => Array<Group<TItem>>;
}

/**
 * Узел иерархии групп: свои элементы и вложенные подгруппы. Элементы узла
 * выводятся до подгрупп — так предмет, попавший только в родителя, не теряется.
 */
export interface GroupNode<TItem> {
  /** Уникальный ключ узла среди всего дерева (обычно путь от корня). */
  key: string;

  /** Готовая подпись разделителя узла. */
  label: string;

  /** Элементы самого узла, без элементов подгрупп. */
  items: Array<TItem>;

  /** Вложенные подгруппы в порядке вывода. */
  children: Array<GroupNode<TItem>>;
}

export interface GroupSortTree<TItem> {
  mode: 'tree';
  build: (items: Array<TItem>) => Array<GroupNode<TItem>>;
}

export type GroupSort<TItem> =
  | GroupSortAuto
  | GroupSortOrdered
  | GroupSortComparator
  | GroupSortCustom<TItem>
  | GroupSortTree<TItem>;
