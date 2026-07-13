import type { SourceResponse } from '~/shared/types';

import type { SearchItemsType } from './const';

export interface GlobalSearchItem {
  url: string;
  name: {
    rus: string;
    // У статей и новостей английского названия нет — бэк опускает поле.
    eng?: string;
  };
  type: SearchItemsType;
  // Источника (книги) нет у статей и новостей — поле отсутствует в ответе.
  source?: SourceResponse;
}

export interface GlobalSearchRes {
  items: GlobalSearchItem[];
  total: number;
  filtered: number;
}
