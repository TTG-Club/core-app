import type {
  ListPresentationConfig,
  ListPresentationItemSort,
} from '~infrastructure/list-presentation/model';

import type { MagicItemLinkResponse } from './link';

export type MagicItemGrouping = 'RARITY' | 'CATEGORY' | 'NONE';
export type MagicItemSorting = 'RARITY' | 'NAME' | 'ENGLISH';

/**
 * Сравнивает магические предметы по русскому названию.
 */
function compareMagicItemsByRussianName(
  firstMagicItem: MagicItemLinkResponse,
  secondMagicItem: MagicItemLinkResponse,
): number {
  return (
    sortString(firstMagicItem.name.rus, secondMagicItem.name.rus)
    || sortString(firstMagicItem.url, secondMagicItem.url)
  );
}

/**
 * Сравнивает магические предметы по английскому названию.
 */
function compareMagicItemsByEnglishName(
  firstMagicItem: MagicItemLinkResponse,
  secondMagicItem: MagicItemLinkResponse,
): number {
  return (
    sortString(firstMagicItem.name.eng, secondMagicItem.name.eng)
    || compareMagicItemsByRussianName(firstMagicItem, secondMagicItem)
  );
}

/**
 * Создаёт сортировку по порядку редкостей из словаря.
 */
function createMagicItemRaritySort(
  getRarityOrder: () => Set<string>,
): ListPresentationItemSort<MagicItemLinkResponse> {
  const rarityIndexes = new Map(
    Array.from(getRarityOrder()).map((rarity, rarityIndex) => [
      rarity,
      rarityIndex,
    ]),
  );

  return (firstMagicItem, secondMagicItem) => {
    const firstRarityIndex = rarityIndexes.get(firstMagicItem.rarity);
    const secondRarityIndex = rarityIndexes.get(secondMagicItem.rarity);

    if (firstRarityIndex !== undefined && secondRarityIndex !== undefined) {
      return (
        firstRarityIndex - secondRarityIndex
        || compareMagicItemsByRussianName(firstMagicItem, secondMagicItem)
      );
    }

    if (firstRarityIndex !== undefined) {
      return -1;
    }

    if (secondRarityIndex !== undefined) {
      return 1;
    }

    return (
      sortString(firstMagicItem.rarity, secondMagicItem.rarity)
      || compareMagicItemsByRussianName(firstMagicItem, secondMagicItem)
    );
  };
}

/**
 * Создаёт конфигурацию представления магических предметов.
 */
export function createMagicItemListPresentationConfig(
  getRarityOrder: () => Set<string>,
): ListPresentationConfig<
  MagicItemLinkResponse,
  MagicItemGrouping,
  MagicItemSorting
> {
  return {
    sectionKey: 'magic-items',
    defaultGrouping: 'RARITY',
    defaultSorting: 'RARITY',
    groupingOptions: [
      {
        label: 'По редкости',
        value: 'RARITY',
        apiValue: 'RARITY',
        field: 'rarity',
        groupSort: () => ({
          mode: 'ordered',
          order: getRarityOrder(),
          unknown: 'after',
        }),
      },
      {
        label: 'По категории',
        value: 'CATEGORY',
        apiValue: 'CATEGORY',
        field: 'category',
      },
      {
        label: 'Без группировки',
        value: 'NONE',
        apiValue: 'NONE',
      },
    ],
    sortingOptions: [
      {
        label: 'По редкости',
        value: 'RARITY',
        apiValue: 'RARITY',
        resolveItemSort: () => createMagicItemRaritySort(getRarityOrder),
      },
      {
        label: 'По русскому названию',
        value: 'NAME',
        apiValue: 'NAME',
        itemSort: compareMagicItemsByRussianName,
      },
      {
        label: 'По английскому названию',
        value: 'ENGLISH',
        apiValue: 'ENGLISH',
        itemSort: compareMagicItemsByEnglishName,
      },
    ],
  };
}
