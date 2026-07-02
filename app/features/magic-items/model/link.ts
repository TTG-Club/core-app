import type { NameResponse, SourceResponse } from '~/shared/types';

export interface MagicItemLinkResponse {
  url: string;
  name: NameResponse;
  rarity: string; // редкость
  category: string; // категория
  attunement: boolean; // настройка
  source: SourceResponse;
}
