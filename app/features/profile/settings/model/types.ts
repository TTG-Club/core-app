export interface SavedFilterCondition {
  name: string;
  value: string;
  selected: boolean | null;
}

export interface SavedFilterGroup {
  key: string;
  name: string;
  filters: SavedFilterCondition[];
}

export interface SavedFilter {
  groups: SavedFilterGroup[];
}

export interface SavedFilterResponse {
  id: string;
  filter: SavedFilter;
}
