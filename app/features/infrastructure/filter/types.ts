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
  [p: string]: unknown;
}

export type FilterItems = Array<FilterItem>;

export interface FilterRequestItem {
  key: string;
  selected: boolean | null;
  [p: string]: unknown;
}

export interface FilterRequestGroup {
  key: string;
  filters: Array<FilterRequestItem>;
}

export interface FilterRequest {
  groups: Array<FilterRequestGroup>;
  version: string;
}
