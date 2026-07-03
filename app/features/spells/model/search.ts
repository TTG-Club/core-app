import type { SpellLinkResponse } from './link';

// Количество заклинаний, запрашиваемых за одну страницу.
export const SPELL_LIST_PAGE_SIZE = 60;

// Расстояние до низа страницы, при котором загружается следующая страница.
export const SPELL_LIST_LOAD_MORE_DISTANCE = 900;
export const SPELL_CLASS_GROUP_PAGE_SIZE = 20;
export const SPELL_CLASS_GROUP_LOAD_MORE_LABEL = 'Показать ещё';
export const SPELL_CLASS_GROUP_RETRY_LABEL = 'Повторить';
export const SPELL_WITHOUT_CLASS_GROUP_KEY = '__without_class__';
export const SPELL_WITHOUT_CLASS_GROUP_LABEL = 'Без класса';

export interface SpellClassPageGroup {
  key: string;
  label: string;
  spells: Array<SpellLinkResponse>;
  page: number;
  hasNextPage: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export interface SpellSearchPageResponse {
  value: Array<SpellLinkResponse>;
  Count: number;
}

export type SpellSearchResponse =
  | Array<SpellLinkResponse>
  | SpellSearchPageResponse;
