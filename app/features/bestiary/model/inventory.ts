import type { CreatureInventorySection } from './create';
import type { CreatureInventoryItemResponse } from './detail';

/** Раздел позиции по умолчанию: записи старого импорта приходят без него. */
const DEFAULT_INVENTORY_SECTION: CreatureInventorySection = 'items';

/** Позиция инвентаря, подготовленная к показу. */
export interface CreatureInventoryEntry {
  name: string;
  quantity: number | undefined;
  description: string | undefined;
  /** Раздел карточки: он же первый сегмент её адреса и выбор дровера. */
  section: CreatureInventorySection;
  /** Слаг карточки предмета; без него позиция остаётся текстом. */
  url: string | undefined;
}

/**
 * Позиции инвентаря для показа: карточка, её раздел со слагом и количество.
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
            section: inventoryItem.section ?? DEFAULT_INVENTORY_SECTION,
            url: inventoryItem.url,
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
