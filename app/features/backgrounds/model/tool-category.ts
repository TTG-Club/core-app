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

/** Тип предмета одной из категорий, которыми называется выбор. */
const toolCategoryItemTypeSchema = z.custom<ItemType>((value) =>
  BACKGROUND_TOOL_CATEGORIES.some((category) => category.itemType === value),
);

/** Категории в том виде, в каком их отдаёт загрузчик. */
const backgroundToolCategoriesSchema = z.array(
  z.object({
    itemType: toolCategoryItemTypeSchema,
    label: z.string(),
    allUrls: z.array(z.string()),
    toolUrls: z.array(z.string()),
  }),
);

/**
 * Разбирает категории из кэша страницы. Загрузчик кладёт их туда сам, но в
 * браузер они приезжают разметкой страницы, поэтому проверяются схемой, как
 * любые внешние данные.
 *
 * @param input закэшированное значение.
 * @returns категории; `undefined` — кэша нет или он негоден, и нужна загрузка.
 */
export function parseBackgroundToolCategories(
  input: unknown,
): Array<BackgroundToolCategory> | undefined {
  const parsed = backgroundToolCategoriesSchema.safeParse(input);

  return parsed.success ? parsed.data : undefined;
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
