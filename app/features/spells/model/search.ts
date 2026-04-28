import type { SpellLinkResponse } from './link';

// Количество заклинаний, запрашиваемых за одну страницу.
export const SPELL_LIST_PAGE_SIZE = 60;

// Расстояние до низа страницы, при котором загружается следующая страница.
export const SPELL_LIST_LOAD_MORE_DISTANCE = 900;

export interface SpellSearchPageResponse {
  value: Array<SpellLinkResponse>;
  Count: number;
}

export type SpellSearchResponse =
  | Array<SpellLinkResponse>
  | SpellSearchPageResponse;
