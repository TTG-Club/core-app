import type { ComputedRef } from 'vue';
import type { LocationQuery } from 'vue-router';

import { buildSearchQuery, parseFilter } from '~infrastructure/filter';

interface CatalogSourceQuery {
  /**
   * Query-параметр источников для search-эндпоинта раздела:
   * `{ source: 'PHB,XGE' }` либо `{}`, если выбор источников неизвестен.
   */
  sourceQuery: ComputedRef<LocationQuery>;
}

/**
 * Глобальная настройка источников (профиль → «Настройка источников») для
 * каталогов листа персонажа.
 *
 * Разделы сайта не хранят выбор источников на клиенте: бэкенд помечает
 * `selected` в группах `sources` ответа `/api/v2/{section}/filters` по
 * сохранённому фильтру пользователя, а поиск получает их как `source=...`.
 * Модалки листа этого запроса не делали и показывали каталог целиком —
 * включая отключённые в профиле книги.
 *
 * Композабл дожидается фильтров до возврата, поэтому первый же запрос каталога
 * уходит с источниками и список не мигает лишними строками. Ошибка запроса
 * каталог не блокирует: тогда поиск идёт без ограничения по источникам.
 *
 * @param key ключ `useAsyncData` — ответ кешируется между открытиями модалки.
 * @param filtersPath эндпоинт фильтров раздела (`/api/v2/{section}/filters`).
 * @returns query-параметр источников для запроса каталога.
 */
export async function useCatalogSourceQuery(
  key: string,
  filtersPath: string,
): Promise<CatalogSourceQuery> {
  const sourceRequest = useAsyncData(
    key,
    async () => {
      const response = await $fetch<unknown>(filtersPath, {
        method: 'GET',
        retry: 0,
      });

      return parseFilter(response).sources ?? [];
    },
    { server: false, default: () => [] },
  );

  // Сборщик query тот же, что у разделов, — источники сериализуются одинаково.
  // Computed создаётся до `await`: после него у композабла уже нет активного
  // scope компонента, и вычисляемое значение не было бы к нему привязано.
  const sourceQuery = computed<LocationQuery>(() =>
    buildSearchQuery({ filters: [], sources: sourceRequest.data.value }),
  );

  await sourceRequest;

  return { sourceQuery };
}
