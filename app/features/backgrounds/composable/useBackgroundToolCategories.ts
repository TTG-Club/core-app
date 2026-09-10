import type { ComputedRef } from 'vue';

import type { NuxtApp } from '#app';

import type {
  BackgroundDetailResponse,
  BackgroundToolCategory,
} from '../model';

import { ITEM_TYPE_FILTER_KEY, parseItemLinks } from '~items/model';
import { ITEMS_SEARCH_ENDPOINT } from '~ui/select';

import {
  BACKGROUND_TOOL_CATEGORIES,
  buildBackgroundToolCategories,
  parseBackgroundToolCategories,
} from '../model';

/**
 * Ключ `useAsyncData` категорий: ответ общий для страницы и дроверов — одна и
 * та же предыстория может быть открыта в обоих сразу.
 */
const BACKGROUND_TOOL_CATEGORIES_KEY = 'backgrounds:tool-categories';

interface BackgroundToolCategories {
  /** Категории; пустой список, пока они не загружены или не понадобились. */
  toolCategories: ComputedRef<Array<BackgroundToolCategory>>;

  /**
   * Выбор есть, а категорий ещё нет: показывать его рано — длинный перечень
   * схлопнулся бы на глазах. После ошибки ждать нечего, и выбор
   * перечисляется поимённо.
   */
  isPending: ComputedRef<boolean>;
}

/**
 * Загружает карточки всех категорий инструментов одним запросом: несколько
 * значений фильтра раздел объединяет, а категорию каждой карточки называют её
 * типы. Источники не передаются: категория считается по всем книгам, и выбор
 * называется ею одинаково для любого читателя.
 *
 * @returns категории инструментов с адресами их карточек.
 */
async function fetchBackgroundToolCategories(): Promise<
  Array<BackgroundToolCategory>
> {
  const response = await $fetch<unknown>(ITEMS_SEARCH_ENDPOINT, {
    method: 'GET',
    query: {
      [ITEM_TYPE_FILTER_KEY]: BACKGROUND_TOOL_CATEGORIES.map(
        (category) => category.itemType,
      ).join(','),
    },
  });

  return buildBackgroundToolCategories(parseItemLinks(response));
}

/**
 * Категории из уже загруженного ответа. По умолчанию Nuxt берёт кэш только при
 * гидратации и стирает ответ, когда закрыта последняя предыстория, — тогда
 * следующая снова показывала бы длинный перечень до ответа. Каталог за сессию
 * не меняется, поэтому ответ живёт, пока открыта страница.
 *
 * @param key ключ `useAsyncData`.
 * @param nuxtApp приложение Nuxt с кэшем страницы.
 * @returns категории; `undefined` — кэша нет, и нужна загрузка.
 */
function getCachedBackgroundToolCategories(
  key: string,
  nuxtApp: NuxtApp,
): Array<BackgroundToolCategory> | undefined {
  return parseBackgroundToolCategories(
    nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  );
}

/**
 * Категории инструментов раздела «Предметы» для блока владения: по ним выбор
 * из всей категории называется ею, а не перечнем в семнадцать названий.
 *
 * Грузятся, только если у предыстории есть выбор из списка, — остальным
 * категории не нужны. Загрузка идёт и на сервере, а загруженный ответ
 * переживает закрытие предыстории: следующая открытая предыстория показывает
 * выбор сразу.
 *
 * @param background деталь предыстории.
 * @returns категории и признак их загрузки.
 */
export function useBackgroundToolCategories(
  background: MaybeRefOrGetter<BackgroundDetailResponse>,
): BackgroundToolCategories {
  const hasToolPool = computed(() =>
    Boolean(toValue(background).toolChoice?.from?.length),
  );

  const {
    data: loadedToolCategories,
    status,
    execute,
  } = useAsyncData(
    BACKGROUND_TOOL_CATEGORIES_KEY,
    fetchBackgroundToolCategories,
    {
      default: () => [],
      immediate: hasToolPool.value,
      getCachedData: getCachedBackgroundToolCategories,
    },
  );

  // Панель раздела не пересоздаёт тело предыстории, а меняет ему запись: у
  // следующей выбор может появиться, когда категории ещё не грузились.
  watch(hasToolPool, (isNeeded) => {
    if (isNeeded && status.value === 'idle') {
      void execute();
    }
  });

  return {
    toolCategories: computed(() => loadedToolCategories.value),
    isPending: computed(
      () =>
        hasToolPool.value
        && (status.value === 'idle' || status.value === 'pending'),
    ),
  };
}
