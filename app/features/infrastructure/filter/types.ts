export interface FilterGroup {
  key: string;
  name: string;
  type: 'filter' | 'singleton';
  supportsMode?: boolean;
  supportsUnion?: boolean;

  // UI mutable states
  mode?: boolean; // true = exclude
  union?: boolean; // true = OR

  values?: FilterItems;
  filters?: FilterItems;
}

export type FilterGroups = Array<FilterGroup>;

export interface FilterItem {
  id: string | number; // For fetching query param
  value: string; // Used internally or for display
  name: string;
  selected: boolean | null; // UI state
  [p: string]: unknown;
}

export type FilterItems = Array<FilterItem>;

export interface Filter {
  filters: FilterGroups;
  sources?: FilterGroups;
}

// Removing FilterRequest logic since encoding to URLSearchParams doesn't use the old structure anymore.
