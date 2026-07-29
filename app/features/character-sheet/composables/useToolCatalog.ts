import type { ComputedRef } from 'vue';
import type { LocationQuery } from 'vue-router';

import type { FilterGroups } from '~infrastructure/filter';

import type {
  CharacterToolProficiency,
  ItemCatalogItem,
  ToolCatalogEntry,
  ToolCatalogGroup,
  ToolProficiencyGroupKey,
} from '../model';

import {
  buildSearchQuery,
  getGroupItems,
  parseFilter,
} from '~infrastructure/filter';

import {
  ITEMS_FILTERS_PATH,
  ITEMS_SEARCH_PATH,
  parseItemCatalog,
  resolveToolProficiencies,
  TOOL_CATALOG_GROUP_ORDER,
  TOOL_CATALOG_ITEM_TYPES,
  TOOL_CATALOG_OTHER_GROUP_TITLE,
} from '../model';

interface ToolCatalog {
  /** Группы инструментов раздела «Предметы»; пустые категории отсеяны. */
  groups: ComputedRef<ToolCatalogGroup[]>;

  /** Все инструменты каталога одним списком. */
  catalogItems: ComputedRef<ToolCatalogEntry[]>;

  /** Каталог ещё грузится. */
  isLoading: ComputedRef<boolean>;

  /** Каталог загружен и пуст: инструментов в разделе нет (так на деве). */
  isEmpty: ComputedRef<boolean>;

  /** Названия инструментов указанных групп; без групп — весь каталог. */
  getToolNamesForGroups: (groupKeys?: ToolProficiencyGroupKey[]) => string[];

  /** Сверяет владения с каталогом: ненайденное остаётся своим инструментом. */
  resolveTools: (
    tools: CharacterToolProficiency[],
  ) => CharacterToolProficiency[];

  /** Загружает каталог; повторный вызов после успеха ничего не делает. */
  load: () => Promise<void>;
}

/** Ключ `useAsyncData` каталога: ответ общий для всех модалок листа. */
const TOOL_CATALOG_KEY = 'character-sheet:tool-catalog';

/** Ключ `useAsyncData` фильтров раздела «Предметы» (источники и категории). */
const TOOL_CATALOG_FILTERS_KEY = 'character-sheet:tool-catalog-filters';

/** Ключ группы фильтров раздела с категориями предметов. */
const ITEM_TYPE_FILTER_KEY = 'itemType';

/** Предметы раздела, найденные для одной группы инструментов. */
interface ToolCatalogResponse {
  key: ToolProficiencyGroupKey;
  items: ItemCatalogItem[];
}

/**
 * Подписи групп берём из фильтров раздела «Предметы» — своих названий категорий
 * лист не держит. Исключение — «прочие инструменты»: категория `TOOL` в разделе
 * называется просто «Инструменты» и рядом с ремесленными читалась бы как дубль.
 *
 * @param groupKey ключ группы каталога.
 * @param filterGroups группы фильтров раздела «Предметы».
 * @returns подпись группы либо пустая строка, если категории в фильтрах нет.
 */
function getGroupTitle(
  groupKey: ToolProficiencyGroupKey,
  filterGroups: FilterGroups,
): string {
  if (groupKey === 'other') {
    return TOOL_CATALOG_OTHER_GROUP_TITLE;
  }

  const itemTypeGroup = filterGroups.find(
    (group) => group.key === ITEM_TYPE_FILTER_KEY,
  );

  const itemType = TOOL_CATALOG_ITEM_TYPES[groupKey];

  const filterItem = itemTypeGroup
    ? getGroupItems(itemTypeGroup).find((value) => value.id === itemType)
    : undefined;

  return filterItem?.name ?? '';
}

/**
 * Раскладка предметов раздела по группам инструментов. Категория `TOOL` —
 * надмножество ремесленных инструментов, поэтому «прочие» получаются
 * вычитанием: иначе инструменты ремесленника попали бы в обе группы.
 *
 * @param responses предметы каталога по группам.
 * @param filterGroups группы фильтров раздела (источник подписей).
 * @returns непустые группы каталога инструментов.
 */
function buildCatalogGroups(
  responses: ToolCatalogResponse[],
  filterGroups: FilterGroups,
): ToolCatalogGroup[] {
  const artisanItems =
    responses.find((response) => response.key === 'artisan')?.items ?? [];

  const artisanUrls = new Set(
    artisanItems.map((catalogItem) => catalogItem.url),
  );

  return TOOL_CATALOG_GROUP_ORDER.map((groupKey) => {
    const catalogItems =
      responses.find((response) => response.key === groupKey)?.items ?? [];

    const groupItems =
      groupKey === 'other'
        ? catalogItems.filter(
            (catalogItem) => !artisanUrls.has(catalogItem.url),
          )
        : catalogItems;

    return {
      key: groupKey,
      title: getGroupTitle(groupKey, filterGroups),
      items: groupItems.map((catalogItem) => ({
        name: catalogItem.name,
        url: catalogItem.url,
      })),
    };
  }).filter((group) => group.items.length > 0);
}

/**
 * Каталог инструментов для листа персонажа — целиком из раздела «Предметы»:
 * своего списка инструментов лист не держит, поэтому в модалке владения и в
 * мастерах класса/предыстории видно ровно то, что заведено на сайте.
 *
 * Инструмента, которого в разделе нет, каталог не придумывает: такое владение
 * остаётся своим инструментом игрока — без ссылки и без кнопки описания.
 *
 * Запрос ленивый: модалки открываются мгновенно, каталог нужен после открытия.
 *
 * @returns группы каталога, статусы загрузки и помощники сверки.
 */
export function useToolCatalog(): ToolCatalog {
  const filtersRequest = useAsyncData(
    TOOL_CATALOG_FILTERS_KEY,
    async () => {
      const response = await $fetch<unknown>(ITEMS_FILTERS_PATH, {
        method: 'GET',
        retry: 0,
      });

      return parseFilter(response);
    },
    { server: false, immediate: false },
  );

  // Тот же ответ фильтров даёт выбранные в профиле источники. В запрос уходят
  // ТОЛЬКО они: сохранённый в профиле выбор категорий перебил бы `itemType`,
  // которым каталог и разбирается на группы.
  const sourceQuery = computed<LocationQuery>(() =>
    buildSearchQuery({
      filters: [],
      sources: filtersRequest.data.value?.sources ?? [],
    }),
  );

  const catalogRequest = useAsyncData<ToolCatalogResponse[]>(
    TOOL_CATALOG_KEY,
    () =>
      Promise.all(
        TOOL_CATALOG_GROUP_ORDER.map(async (groupKey) => {
          const response = await $fetch<unknown>(ITEMS_SEARCH_PATH, {
            method: 'GET',
            query: {
              itemType: TOOL_CATALOG_ITEM_TYPES[groupKey],
              ...sourceQuery.value,
            },
            retry: 0,
          });

          return { key: groupKey, items: parseItemCatalog(response) };
        }),
      ),
    { server: false, immediate: false },
  );

  const groups = computed<ToolCatalogGroup[]>(() =>
    buildCatalogGroups(
      catalogRequest.data.value ?? [],
      filtersRequest.data.value?.filters ?? [],
    ),
  );

  const catalogItems = computed<ToolCatalogEntry[]>(() =>
    groups.value.flatMap((group) => group.items),
  );

  const isLoading = computed(
    () =>
      catalogRequest.status.value === 'pending'
      || filtersRequest.status.value === 'pending',
  );

  const isEmpty = computed(
    () => !isLoading.value && catalogItems.value.length === 0,
  );

  function getToolNamesForGroups(
    groupKeys: ToolProficiencyGroupKey[] = [],
  ): string[] {
    const selectedGroups = groupKeys.length
      ? groups.value.filter((group) => groupKeys.includes(group.key))
      : groups.value;

    return selectedGroups.flatMap((group) =>
      group.items.map((catalogItem) => catalogItem.name),
    );
  }

  function resolveTools(
    tools: CharacterToolProficiency[],
  ): CharacterToolProficiency[] {
    return resolveToolProficiencies(tools, catalogItems.value);
  }

  async function load(): Promise<void> {
    // Ответ общий по ключу: если каталог уже пришёл в другой модалке, повторный
    // запрос не нужен.
    if (catalogRequest.status.value === 'success') {
      return;
    }

    // Фильтры дают и подписи групп, и выбранные в профиле источники, поэтому
    // ждём их до запроса каталога — иначе в списке мелькнут отключённые книги.
    await filtersRequest.execute();

    await catalogRequest.execute();
  }

  return {
    groups,
    catalogItems,
    isLoading,
    isEmpty,
    getToolNamesForGroups,
    resolveTools,
    load,
  };
}
