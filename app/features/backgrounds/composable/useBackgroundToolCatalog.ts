import type { ComputedRef } from 'vue';

import type { NuxtApp } from '#app';

import type { BackgroundDetailResponse, BackgroundToolCatalog } from '../model';

import { ITEM_TYPE_FILTER_KEY, parseItemLinks } from '~items/model';
import { ITEMS_SEARCH_ENDPOINT } from '~ui/select';

import {
  BACKGROUND_TOOL_CATALOG_ITEM_TYPE,
  buildBackgroundToolCatalog,
  createEmptyBackgroundToolCatalog,
  parseBackgroundToolCatalog,
} from '../model';

/**
 * Ключ `useAsyncData` каталога: ответ общий для страницы и дроверов — одна и
 * та же предыстория может быть открыта в обоих сразу.
 */
const BACKGROUND_TOOL_CATALOG_KEY = 'backgrounds:tool-catalog';

interface BackgroundToolCatalogState {
  /** Каталог; пустой, пока он не загружен или не понадобился. */
  toolCatalog: ComputedRef<BackgroundToolCatalog>;

  /**
   * Инструменты есть, а каталога ещё нет: показывать владение рано — длинный
   * перечень схлопнулся бы на глазах, а адреса сменились бы названиями. После
   * ошибки ждать нечего, и владение показывается как есть.
   */
  isPending: ComputedRef<boolean>;
}

/**
 * Загружает все карточки типа «Инструменты» одним запросом: тип — надмножество
 * категорий, а категорию каждой карточки называют её типы. Источники не
 * передаются: категория считается по всем книгам, и выбор называется ею
 * одинаково для любого читателя.
 *
 * @returns каталог инструментов: категории и названия карточек.
 */
async function fetchBackgroundToolCatalog(): Promise<BackgroundToolCatalog> {
  const response = await $fetch<unknown>(ITEMS_SEARCH_ENDPOINT, {
    method: 'GET',
    query: {
      [ITEM_TYPE_FILTER_KEY]: BACKGROUND_TOOL_CATALOG_ITEM_TYPE,
    },
  });

  return buildBackgroundToolCatalog(parseItemLinks(response));
}

/**
 * Каталог из уже загруженного ответа. По умолчанию Nuxt берёт кэш только при
 * гидратации и стирает ответ, когда закрыта последняя предыстория, — тогда
 * следующая снова ждала бы загрузки. Каталог за сессию не меняется, поэтому
 * ответ живёт, пока открыта страница.
 *
 * @param key ключ `useAsyncData`.
 * @param nuxtApp приложение Nuxt с кэшем страницы.
 * @returns каталог; `undefined` — кэша нет, и нужна загрузка.
 */
function getCachedBackgroundToolCatalog(
  key: string,
  nuxtApp: NuxtApp,
): BackgroundToolCatalog | undefined {
  return parseBackgroundToolCatalog(
    nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  );
}

/**
 * Инструменты раздела «Предметы» для блока владения: по категориям выбор из
 * всей категории называется ею, а не перечнем в семнадцать названий, по
 * названиям подписываются ссылки, сохранённые без снимка названия.
 *
 * Грузится, только если у предыстории есть владение инструментами ссылками, —
 * остальным каталог не нужен. Загрузка идёт и на сервере, а загруженный ответ
 * переживает закрытие предыстории: следующая открытая предыстория показывает
 * владение сразу.
 *
 * @param background деталь предыстории.
 * @returns каталог и признак его загрузки.
 */
export function useBackgroundToolCatalog(
  background: MaybeRefOrGetter<BackgroundDetailResponse>,
): BackgroundToolCatalogState {
  const hasToolRefs = computed(() => {
    const { toolProficiencies, toolChoice } = toValue(background);

    return Boolean(toolProficiencies?.length || toolChoice?.from?.length);
  });

  const {
    data: loadedToolCatalog,
    status,
    execute,
  } = useAsyncData(BACKGROUND_TOOL_CATALOG_KEY, fetchBackgroundToolCatalog, {
    default: createEmptyBackgroundToolCatalog,
    immediate: hasToolRefs.value,
    getCachedData: getCachedBackgroundToolCatalog,
  });

  // Панель раздела не пересоздаёт тело предыстории, а меняет ему запись: у
  // следующей ссылки могут появиться, когда каталог ещё не грузился.
  watch(hasToolRefs, (isNeeded) => {
    if (isNeeded && status.value === 'idle') {
      void execute();
    }
  });

  return {
    toolCatalog: computed(() => loadedToolCatalog.value),
    isPending: computed(
      () =>
        hasToolRefs.value
        && (status.value === 'idle' || status.value === 'pending'),
    ),
  };
}
