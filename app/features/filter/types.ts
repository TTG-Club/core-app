export interface Filter {
  groups: FilterGroups;
  version: string;
}

export interface FilterGroup {
  key: string;
  name: string;
  filters: FilterItems;
}

export type FilterGroups = Array<FilterGroup>;

export interface FilterItem {
  key: string;
  name: string;
  selected: boolean | null;
}

export type FilterItems = Array<FilterItem>;
