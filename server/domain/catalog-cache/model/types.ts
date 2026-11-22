/** Ответ core-api в том виде, в каком его достаточно отдать посетителю. */
export interface CatalogResponse {
  /** Код ответа core-api. */
  status: number;
  /** Тело ответа как есть, без разбора. */
  body: string;
  /** Тип содержимого из ответа core-api. */
  contentType: string;
}

/** Что стало с запросом каталога: ответ взят из кэша или запрошен заново. */
export type CatalogCacheState = 'hit' | 'miss';

/** Ответ каталога вместе с тем, откуда он взят. */
export interface ResolvedCatalogResponse {
  response: CatalogResponse;
  state: CatalogCacheState;
}
