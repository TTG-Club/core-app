import type { SourceResponse } from '~/shared/types';

import type { SearchItemsType } from './const';

export interface GlobalSearchItem {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  type: SearchItemsType;
  source: SourceResponse;
}

export interface GlobalSearchRes {
  items: GlobalSearchItem[];
  total: number;
  filtered: number;
}
