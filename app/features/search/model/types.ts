import type { SearchItemsType } from './const';

interface GlobalSearchItem {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  type: SearchItemsType;
  source: {
    name: {
      label: string;
      rus: string;
      eng: string;
    };
    group: {
      label: string;
      rus: string;
    };
    page: number;
  };
}

export interface GlobalSearchRes {
  result: GlobalSearchItem[];
  total: number;
}
