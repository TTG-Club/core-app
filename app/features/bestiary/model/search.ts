import type { CreatureLinkResponse } from './link';

// Количество существ, запрашиваемых за одну страницу.
export const BESTIARY_LIST_PAGE_SIZE = 60;

// Расстояние до низа страницы, при котором загружается следующая страница.
export const BESTIARY_LIST_LOAD_MORE_DISTANCE = 900;

export interface CreatureSearchPageResponse {
  value: Array<CreatureLinkResponse>;
  Count: number;
}

export type CreatureSearchResponse =
  | Array<CreatureLinkResponse>
  | CreatureSearchPageResponse;
