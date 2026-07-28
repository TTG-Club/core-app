import type { ComputedRef } from 'vue';
import type { LocationQuery } from 'vue-router';

import {
  buildSearchQuery,
  getSelectedItemIds,
  parseFilter,
} from '~infrastructure/filter';

interface CatalogSourceQuery {
  /**
   * Query-параметр источников для search-эндпоинта раздела:
   * `{ source: 'PHB,XGE' }` либо `{}`, если выбор источников неизвестен.
   */
  sourceQuery: ComputedRef<LocationQuery>;

  /**
   * Идентификаторы включённых источников (`['PHB', 'FRHoF']`) — для разделов,
   * чей эндпоинт по источникам не фильтрует и отбор идёт на клиенте. Пустой
   * список означает, что ограничения нет.
   */
  selectedSourceIds: ComputedRef<string[]>;
}

interface LazyCatalogSourceQuery extends CatalogSourceQuery {
  /** Загружает фильтры раздела; повторный вызов после успеха ничего не делает. */
  load: () => Promise<void>;
}

/**
 * Глобальная настройка источников (профиль → «Настройка источников») для
 * каталогов листа персонажа без немедленного запроса.
 *
 * Нужна модалкам, которые открываются мгновенно и лезут в каталог только по
 * действию игрока: `await` на верхнем уровне сделал бы компонент асинхронным, и
 * даже правка опыта ждала бы сеть.
 *
 * @param key ключ `useAsyncData` — ответ кешируется между открытиями модалок.
 * @param filtersPath эндпоинт фильтров раздела (`/api/v2/{section}/filters`).
 * @returns источники раздела и функция их загрузки.
 */
export function useLazyCatalogSourceQuery(
  key: string,
  filtersPath: string,
): LazyCatalogSourceQuery {
  const sourceRequest = useAsyncData(
    key,
    async () => {
      const response = await $fetch<unknown>(filtersPath, {
        method: 'GET',
        retry: 0,
      });

      return parseFilter(response).sources ?? [];
    },
    { server: false, default: () => [], immediate: false },
  );

  // Сборщик query тот же, что у разделов, — источники сериализуются одинаково.
  const sourceQuery = computed<LocationQuery>(() =>
    buildSearchQuery({ filters: [], sources: sourceRequest.data.value }),
  );

  const selectedSourceIds = computed(() =>
    sourceRequest.data.value.flatMap(getSelectedItemIds),
  );

  async function load(): Promise<void> {
    // Ответ общий по ключу: если фильтры уже пришли в другой модалке, повторный
    // запрос не нужен.
    if (sourceRequest.status.value === 'success') {
      return;
    }

    await sourceRequest.execute();
  }

  return { sourceQuery, selectedSourceIds, load };
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
 * @returns источники раздела.
 */
export async function useCatalogSourceQuery(
  key: string,
  filtersPath: string,
): Promise<CatalogSourceQuery> {
  const { sourceQuery, selectedSourceIds, load } = useLazyCatalogSourceQuery(
    key,
    filtersPath,
  );

  await load();

  return { sourceQuery, selectedSourceIds };
}
