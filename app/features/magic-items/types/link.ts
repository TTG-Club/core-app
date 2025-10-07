import type { NameResponse, SourceResponse } from '~/shared/types';

export interface MagicItemLinkResponse {
  url: string;
  name: NameResponse;
  rarity: string; // редкость
  attunement: boolean; // настройка
  source: SourceResponse;
}
