import type { SourceResponse } from '~/shared/types';

export interface ItemDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  image: string;
  subtitle: string;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
  cost: string | undefined; // стоимость
  weight: string | undefined; // вес
}
