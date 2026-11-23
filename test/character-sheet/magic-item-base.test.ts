import type {
  ItemCatalogItem,
  ItemSummary,
  MagicItemCatalogItem,
  MagicItemSummary,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  buildMagicItemInventoryItem,
  getInventoryItemId,
  getMagicItemBaseOptions,
} from '~character-sheet/model';

const SWORD_OF_VENGEANCE: MagicItemCatalogItem = {
  url: 'sword-of-vengeance-dmg',
  name: 'Меч мести',
  nameEng: 'Sword of Vengeance',
  category: 'оружие',
  rarity: 'необычное',
  sourceLabel: 'DMG',
};

const RAPIER: ItemSummary = {
  url: 'rapier-phb',
  name: 'Рапира',
  category: 'WEAPON',
  typesLabel: 'Оружие, Воинское оружие',
  cost: '25 зм',
  weight: 2,
  armor: null,
  weapon: null,
  activeEffects: [],
};

/**
 * Справочные данные «Меча мести» с заданной основой.
 *
 * @param baseItem деталь немагической основы; null — основы нет.
 * @param baseItemChosen основу выбрал игрок из нескольких.
 * @returns справочные данные магического предмета.
 */
function createSummary(
  baseItem: ItemSummary | null,
  baseItemChosen: boolean,
): MagicItemSummary {
  return {
    rarity: 'UNCOMMON',
    bonuses: { attack: 1, damage: 1, armorClass: 0 },
    requiresAttunement: true,
    maxCharges: 0,
    activeEffects: [],
    bonusActivation: 'equipped',
    passive: '',
    chargesRecovery: null,
    extraDamage: null,
    baseItem,
    baseItemChosen,
  };
}

describe('магический предмет на выбранной основе', () => {
  it('получает основу в названии и идентификаторе, а вес — у основы', () => {
    const inventoryItem = buildMagicItemInventoryItem(
      SWORD_OF_VENGEANCE,
      createSummary(RAPIER, true),
    );

    expect(inventoryItem.name).toBe('Меч мести (Рапира)');

    expect(inventoryItem.id).toBe(
      'magic-item:sword-of-vengeance-dmg:rapier-phb',
    );

    // Ссылка остаётся на сам магический предмет: по ней открывается карточка.
    expect(inventoryItem.url).toBe('sword-of-vengeance-dmg');
    expect(inventoryItem.weight).toBe(2);
  });

  it('с единственной основой остаётся под своим названием', () => {
    const inventoryItem = buildMagicItemInventoryItem(
      SWORD_OF_VENGEANCE,
      createSummary(RAPIER, false),
    );

    expect(inventoryItem.name).toBe('Меч мести');

    expect(inventoryItem.id).toBe(
      getInventoryItemId('magic-item', SWORD_OF_VENGEANCE.url),
    );

    expect(inventoryItem.weight).toBe(2);
  });

  it('без основы добавляется без веса и боевых параметров', () => {
    const inventoryItem = buildMagicItemInventoryItem(
      SWORD_OF_VENGEANCE,
      createSummary(null, false),
    );

    expect(inventoryItem.name).toBe('Меч мести');
    expect(inventoryItem.weight).toBe(0);
    expect(inventoryItem.weapon).toBeNull();
  });
});

describe('варианты окна выбора основы', () => {
  it('значением варианта служит слаг, описание ведёт в раздел «Предметы»', () => {
    const baseItems: ItemCatalogItem[] = [
      {
        url: 'greataxe-phb',
        name: 'Секира ',
        nameEng: 'Greataxe',
        cost: '30 зм',
        sourceLabel: 'PHB',
      },
    ];

    expect(getMagicItemBaseOptions(baseItems)).toEqual([
      {
        value: 'greataxe-phb',
        label: 'Секира',
        sublabel: 'Greataxe',
        detail: { kind: 'item', url: 'greataxe-phb' },
      },
    ]);
  });
});
