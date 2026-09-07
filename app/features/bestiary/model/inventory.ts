import type { CreatureInventorySection } from './create';
import type { CreatureInventoryItemResponse } from './detail';

/** Раздел позиции по умолчанию: записи старого импорта приходят без него. */
const DEFAULT_INVENTORY_SECTION: CreatureInventorySection = 'items';

/** Позиция инвентаря, подготовленная к показу. */
export interface CreatureInventoryEntry {
  name: string;
  quantity: number | undefined;
  description: string | undefined;
  /** Ссылка на карточку предмета; без слага её не построить. */
  link: string | undefined;
}

/**
 * Позиции инвентаря для показа: карточка, ссылка на неё и количество.
 * Позиция без названия — пустая строка формы, показывать по ней нечего.
 *
 * @param inventory - инвентарь существа из ответа карточки
 */
export function getCreatureInventoryEntries(
  inventory: Array<CreatureInventoryItemResponse> | undefined,
): Array<CreatureInventoryEntry> {
  return (inventory ?? []).flatMap((inventoryItem) =>
    inventoryItem.name
      ? [
          {
            name: inventoryItem.name,
            quantity: inventoryItem.quantity,
            description: inventoryItem.description,
            link: inventoryItem.url
              ? `/${inventoryItem.section ?? DEFAULT_INVENTORY_SECTION}/${inventoryItem.url}`
              : undefined,
          },
        ]
      : [],
  );
}

/**
 * Позиция строкой: «Верёвка ×2». Единственный предмет числом не подписывают.
 *
 * @param name - название позиции; выгрузка передаёт его уже экранированным
 * @param quantity - количество предметов
 */
export function formatCreatureInventoryLabel(
  name: string,
  quantity: number | undefined,
): string {
  return quantity && quantity > 1 ? `${name} ×${quantity}` : name;
}
