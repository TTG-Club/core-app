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

export type GroupSort<TItem> =
  | GroupSortAuto
  | GroupSortOrdered
  | GroupSortComparator
  | GroupSortCustom<TItem>;
