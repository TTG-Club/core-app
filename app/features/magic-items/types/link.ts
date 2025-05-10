import type { NameResponse, SourceResponse } from '~/shared/types';

export interface MagicItemLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  rarity: string; // редкость
  attunement: boolean; // настройка
  source: SourceResponse;
}
