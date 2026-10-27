import type { FilterItems } from '../types';

/** Читает числовое значение, включая дробный показатель опасности. */
function parseRangeValue(value: string): number {
  if (!value.trim()) {
    return Number.NaN;
  }

  const parts = value.split('/');

  if (parts.length === 2) {
    const [numerator, denominator] = parts;

    if (!numerator?.trim() || !denominator?.trim()) {
      return Number.NaN;
    }

    return Number(numerator) / Number(denominator);
  }

  return Number(value);
}

/** Возвращает числовую шкалу или порядок значений, заданный доменом. */
export function getRangeItems(
  items: FilterItems,
  rangeOrder?: ReadonlyArray<string>,
): FilterItems {
  if (rangeOrder) {
    const orderedItems = rangeOrder.flatMap((rangeValue) =>
      items.filter((filterItem) => filterItem.value === rangeValue),
    );

    return orderedItems.length >= 2 ? orderedItems : [];
  }

  const entries = items.map((filterItem) => ({
    filterItem,
    numericValue: parseRangeValue(filterItem.value),
  }));

  if (
    entries.length < 2
    || entries.some((entry) => !Number.isFinite(entry.numericValue))
    || new Set(entries.map((entry) => entry.numericValue)).size
      !== entries.length
  ) {
    return [];
  }

  return entries
    .sort((first, second) => first.numericValue - second.numericValue)
    .map((entry) => entry.filterItem);
}

/** Находит границы выбора на дискретной шкале; пустой выбор охватывает всю шкалу. */
export function getRangeBounds(items: FilterItems): [number, number] {
  const selectedIndexes = items.flatMap((filterItem, index) =>
    filterItem.selected ? [index] : [],
  );

  return [
    selectedIndexes.at(0) ?? 0,
    selectedIndexes.at(-1) ?? Math.max(0, items.length - 1),
  ];
}

/** Выбирает включительно значения между границами, сохраняя исходные ID для API. */
export function selectRangeItems(
  items: FilterItems,
  rangeItems: FilterItems,
  bounds: [number, number],
): FilterItems {
  const [minimum, maximum] = bounds;
  const rangeIds = new Set(rangeItems.map((filterItem) => filterItem.id));

  const selectedIds = new Set(
    rangeItems.slice(minimum, maximum + 1).map((filterItem) => filterItem.id),
  );

  return items.map((filterItem) =>
    rangeIds.has(filterItem.id)
      ? {
          ...filterItem,
          selected: selectedIds.has(filterItem.id) ? true : null,
        }
      : filterItem,
  );
}
