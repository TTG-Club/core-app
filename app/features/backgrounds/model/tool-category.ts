import type { ItemLinkResponse, ItemType } from '~items/model';

import type { BackgroundEntityRef } from './detail';

import { z } from 'zod';

import { ITEM_TYPE_FILTER_KEY } from '~items/model';

import {
  BACKGROUND_TOOL_CATEGORIES,
  GENERIC_ITEM_COST,
  ITEMS_SECTION_PATH,
} from './constants';

/** Категория инструментов раздела «Предметы» с её карточками. */
export interface BackgroundToolCategory {
  /** Тип предмета — значение фильтра `itemType` раздела. */
  itemType: ItemType;

  /** Подпись в родительном падеже: «На выбор 1 из инструментов ремесленника». */
  label: string;

  /** Все карточки категории, вместе с обобщённой. */
  allUrls: Array<string>;

  /** Конкретные инструменты категории — без обобщённой карточки. */
  toolUrls: Array<string>;
}

/**
 * Инструменты раздела «Предметы» для блока владения: категории, которыми
 * называется выбор, и русские названия карточек по адресу.
 */
export interface BackgroundToolCatalog {
  categories: Array<BackgroundToolCategory>;

  /**
   * Название карточки по её адресу. Им подписывается ссылка, у которой нет
   * снимка названия: бэк снимок не подставляет, а запись могла сохраниться
   * без него.
   */
  names: Record<string, string>;
}

/** Тип предмета одной из категорий, которыми называется выбор. */
const toolCategoryItemTypeSchema = z.custom<ItemType>((value) =>
  BACKGROUND_TOOL_CATEGORIES.some((category) => category.itemType === value),
);

/** Каталог в том виде, в каком его отдаёт загрузчик. */
const backgroundToolCatalogSchema = z.object({
  categories: z.array(
    z.object({
      itemType: toolCategoryItemTypeSchema,
      label: z.string(),
      allUrls: z.array(z.string()),
      toolUrls: z.array(z.string()),
    }),
  ),
  names: z.record(z.string(), z.string()),
});

/**
 * Пустой каталог: пока он не загружен, не понадобился или не загрузился.
 *
 * @returns каталог без категорий и названий.
 */
export function createEmptyBackgroundToolCatalog(): BackgroundToolCatalog {
  return { categories: [], names: {} };
}

/**
 * Разбирает каталог из кэша страницы. Загрузчик кладёт его туда сам, но в
 * браузер он приезжает разметкой страницы, поэтому проверяется схемой, как
 * любые внешние данные.
 *
 * @param input закэшированное значение.
 * @returns каталог; `undefined` — кэша нет или он негоден, и нужна загрузка.
 */
export function parseBackgroundToolCatalog(
  input: unknown,
): BackgroundToolCatalog | undefined {
  const parsed = backgroundToolCatalogSchema.safeParse(input);

  return parsed.success ? parsed.data : undefined;
}

/**
 * Каталог инструментов из карточек раздела «Предметы».
 *
 * @param itemLinks все карточки типа «Инструменты».
 * @returns категории и названия карточек.
 */
export function buildBackgroundToolCatalog(
  itemLinks: Array<ItemLinkResponse>,
): BackgroundToolCatalog {
  return {
    categories: buildBackgroundToolCategories(itemLinks),
    names: Object.fromEntries(
      itemLinks.map((itemLink) => [itemLink.url, itemLink.name.rus]),
    ),
  };
}

/**
 * Раскладывает карточки раздела «Предметы» по категориям инструментов.
 * Категория, в которой нет ни одной карточки, отбрасывается: назвать ею выбор
 * всё равно нельзя.
 *
 * @param itemLinks карточки из поиска раздела по категориям инструментов.
 * @returns категории с адресами их карточек.
 */
export function buildBackgroundToolCategories(
  itemLinks: Array<ItemLinkResponse>,
): Array<BackgroundToolCategory> {
  return BACKGROUND_TOOL_CATEGORIES.flatMap(({ itemType, label }) => {
    const categoryLinks = itemLinks.filter((itemLink) =>
      itemLink.types?.includes(itemType),
    );

    if (!categoryLinks.length) {
      return [];
    }

    return [
      {
        itemType,
        label,
        allUrls: categoryLinks.map((itemLink) => itemLink.url),
        toolUrls: categoryLinks
          .filter((itemLink) => itemLink.cost !== GENERIC_ITEM_COST)
          .map((itemLink) => itemLink.url),
      },
    ];
  });
}

/**
 * Категория, которую выбор игрока покрывает целиком: в выборе только её
 * карточки и все её инструменты до единого. Не хватает хотя бы одного —
 * категории нет, и выбор перечисляется поимённо, как раньше.
 *
 * @param pool инструменты, из которых выбирает игрок.
 * @param categories категории инструментов раздела «Предметы».
 * @returns покрытая категория либо `undefined`.
 */
export function findBackgroundToolCategory(
  pool: Array<BackgroundEntityRef>,
  categories: Array<BackgroundToolCategory>,
): BackgroundToolCategory | undefined {
  const poolUrls = new Set(pool.map((reference) => reference.url));

  return categories.find((category) => {
    const categoryUrls = new Set(category.allUrls);

    return (
      category.toolUrls.length > 0
      && [...poolUrls].every((url) => categoryUrls.has(url))
      && category.toolUrls.every((url) => poolUrls.has(url))
    );
  });
}

/**
 * Маркер ссылки на раздел «Предметы» с фильтром категории: по нажатию видно
 * те самые инструменты, из которых выбирают.
 *
 * @param category категория инструментов.
 * @returns маркер разметки сайта.
 */
export function toBackgroundToolCategoryMarker(
  category: BackgroundToolCategory,
): string {
  return `{@link ${category.label}|url:${ITEMS_SECTION_PATH}?${ITEM_TYPE_FILTER_KEY}=${category.itemType}}`;
}
