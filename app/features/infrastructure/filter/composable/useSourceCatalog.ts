import type { SourceCatalogRecord } from '../types';

import { z } from 'zod';

import {
  FILTER_SOURCES_CATALOG_KEY,
  FILTER_SOURCES_CATALOG_PATH,
} from '../model';
import { buildSourceCatalog } from '../utils';

/**
 * Источник из общего списка сайта. Берутся название и обложка: остальное панели
 * выбора не нужно. `catch` гасит битые поля, чтобы один кривой источник не
 * оставил без английских названий все остальные.
 */
const sourceCatalogSchema = z.array(
  z.looseObject({
    name: z.object({
      label: z.string().catch(''),
      rus: z.string().catch(''),
      eng: z.string().catch(''),
    }),
    image: z.string().optional().catch(undefined),
  }),
);

/** Запрашивает общий список источников и оставляет от него названия. */
async function fetchSourceCatalogRecords(): Promise<
  Array<SourceCatalogRecord>
> {
  const payload = await $fetch<unknown>(FILTER_SOURCES_CATALOG_PATH, {
    method: 'POST',
    body: {},
    retry: 0,
  });

  const result = sourceCatalogSchema.safeParse(payload);

  if (!result.success) {
    consola.error('[useSourceCatalog] Некорректный список источников:', {
      error: result.error,
    });

    return [];
  }

  return result.data.map((source) => ({
    acronym: source.name.label,
    name: source.name.rus,
    english: source.name.eng,
    image: source.image,
  }));
}

/**
 * Английские названия и акронимы источников для панели выбора.
 *
 * Фильтры разделов отдают источник одним русским названием, поэтому остальное
 * берётся из общего списка сайта. Запрос уходит только по `load` — когда
 * панель впервые открыли: до этого названия никому не нужны. Кэш общий по
 * ключу, так что панели разных разделов список заново не тянут.
 *
 * @returns Справочник названий и функция, запускающая его загрузку.
 */
export function useSourceCatalog() {
  const {
    data: records,
    status,
    execute,
  } = useAsyncData(FILTER_SOURCES_CATALOG_KEY, fetchSourceCatalogRecords, {
    server: false,
    immediate: false,
    deep: false,
    dedupe: 'defer',
    default: () => [],
  });

  const catalog = computed(() => buildSourceCatalog(records.value));

  /** Загружает справочник, если его ещё не запрашивали. */
  function load(): void {
    if (status.value === 'idle' || status.value === 'error') {
      execute();
    }
  }

  return { catalog, load };
}
