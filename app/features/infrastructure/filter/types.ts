export interface FilterSection {
  groups: FilterGroups;
}

export interface Filter {
  filter: FilterSection;
  sources: FilterSection;
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

export interface FilterSectionRequest {
  groups: Array<FilterRequestGroup>;
}

export interface FilterRequest {
  filter?: FilterSectionRequest;
  sources?: FilterSectionRequest;
}
