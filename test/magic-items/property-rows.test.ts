import type { MagicItemDetailResponse } from '~magic-items/model';

import { describe, expect, it } from 'vitest';

import {
  getMagicItemBaseWeaponDataKey,
  getMagicItemPropertyRows,
  hasMagicItemWeaponProperties,
  MAGIC_ITEM_PROPERTY_LABELS,
  parseMagicItemBaseItemUrls,
  parseMagicItemBaseWeapon,
} from '~magic-items/model';
import {
  createEmptyDamageFormulaPart,
  describeDamageFormulaCreatureTypes,
  listDamageFormulaCreatureTypes,
} from '~ui/damage-formula';

/** Слаг «Булавы распада». */
const MACE_OF_DISRUPTION_URL = 'mace-of-disruption-dmg';

/** Слаг немагической булавы. */
const MACE_URL = 'mace-phb';

/** Ключ типа существа «исчадие». */
const FIEND_CREATURE_TYPE = 'fiend';

/** Ключ типа существа «нежить». */
const UNDEAD_CREATURE_TYPE = 'undead';

/** Урон излучением по исчадиям. */
const RADIANT_AGAINST_FIENDS_FORMULA = `2к6@dmg.radiant@target.type.${FIEND_CREATURE_TYPE}`;

/** Тот же урон излучением по нежити. */
const RADIANT_AGAINST_UNDEAD_FORMULA = `2к6@dmg.radiant@target.type.${UNDEAD_CREATURE_TYPE}`;

/** Урон огнём по любой цели. */
const FIRE_FORMULA = '2к6@dmg.fire';

/** «Сырой» ответ немагической булавы. */
const MACE_RAW_RESPONSE = {
  name: { rus: 'Булава', eng: 'Mace' },
  weapon: {
    damageParts: [{ formula: '1к6@dmg.bludgeoning', target: 'selected' }],
  },
};

/** «Сырой» ответ длинного меча: оружие со свойством «Универсальное». */
const LONGSWORD_RAW_RESPONSE = {
  name: { rus: 'Длинный меч', eng: 'Longsword' },
  weapon: {
    damageParts: [
      {
        formula: '1к8@dmg.slashing',
        target: 'selected',
        versatileFormula: '1к10@dmg.slashing',
      },
    ],
  },
};

/**
 * Создаёт деталь магического предмета с частями дополнительного урона.
 *
 * @param formulas формулы частей дополнительного урона.
 * @returns деталь предмета без прочей структуры.
 */
function createMagicItemDetail(
  formulas: Array<string>,
): MagicItemDetailResponse {
  return {
    url: MACE_OF_DISRUPTION_URL,
    name: { rus: 'Булава распада', eng: 'Mace of Disruption' },
    image: '',
    subtitle: 'Оружие (булава), редкое (требуется настройка)',
    source: {
      name: { label: 'DMG', rus: 'Руководство мастера', eng: 'DMG' },
      group: { label: 'Basic', rus: 'Официальные источники' },
      page: 225,
    },
    description: [],
    updatedAt: '',
    damageParts: formulas.map((formula) => ({
      ...createEmptyDamageFormulaPart(),
      formula,
    })),
  };
}

/**
 * Находит строки значения свойства по его названию.
 *
 * @param magicItem деталь магического предмета.
 * @param propertyLabel название строки блока свойств.
 * @param baseWeaponResponse «сырой» ответ основы; без него основы нет.
 * @returns строки значения; `undefined` — такой строки в блоке нет.
 */
function findPropertyLines(
  magicItem: MagicItemDetailResponse,
  propertyLabel: string,
  baseWeaponResponse?: unknown,
): Array<string> | undefined {
  return getMagicItemPropertyRows(
    magicItem,
    parseMagicItemBaseWeapon(baseWeaponResponse),
  ).find((propertyRow) => propertyRow.label === propertyLabel)?.lines;
}

describe('типы существ в формуле урона', () => {
  it('читает тип существа из токена', () => {
    expect(
      listDamageFormulaCreatureTypes(RADIANT_AGAINST_UNDEAD_FORMULA),
    ).toEqual([UNDEAD_CREATURE_TYPE]);
  });

  it('у урона по любой цели типов нет', () => {
    expect(listDamageFormulaCreatureTypes(FIRE_FORMULA)).toEqual([]);
  });

  it('перечисляет типы фразой', () => {
    expect(describeDamageFormulaCreatureTypes([FIEND_CREATURE_TYPE])).toBe(
      'по исчадиям',
    );

    expect(
      describeDamageFormulaCreatureTypes([
        FIEND_CREATURE_TYPE,
        UNDEAD_CREATURE_TYPE,
      ]),
    ).toBe('по исчадиям и нежити');

    expect(describeDamageFormulaCreatureTypes([])).toBe('');
  });
});

describe('строки блока свойств магического предмета', () => {
  it('склеивает одинаковый урон по разным типам существ в одну строку', () => {
    const magicItem = createMagicItemDetail([
      RADIANT_AGAINST_FIENDS_FORMULA,
      RADIANT_AGAINST_UNDEAD_FORMULA,
    ]);

    expect(
      findPropertyLines(magicItem, MAGIC_ITEM_PROPERTY_LABELS.extraDamage),
    ).toEqual(['2к6 излучение – по исчадиям и нежити']);
  });

  it('урон по любой цели не склеивает и условием не подписывает', () => {
    const magicItem = createMagicItemDetail([FIRE_FORMULA, FIRE_FORMULA]);

    expect(
      findPropertyLines(magicItem, MAGIC_ITEM_PROPERTY_LABELS.extraDamage),
    ).toEqual(['2к6 огненный', '2к6 огненный']);
  });

  it('разный урон по типам существ оставляет разными строками', () => {
    const magicItem = createMagicItemDetail([
      RADIANT_AGAINST_UNDEAD_FORMULA,
      '1к6@dmg.fire@target.type.plant',
    ]);

    expect(
      findPropertyLines(magicItem, MAGIC_ITEM_PROPERTY_LABELS.extraDamage),
    ).toEqual(['2к6 излучение – по нежити', '1к6 огненный – по растениям']);
  });

  it('первой строкой показывает основной урон немагической основы', () => {
    const magicItem = createMagicItemDetail([RADIANT_AGAINST_UNDEAD_FORMULA]);

    const [firstRow] = getMagicItemPropertyRows(
      magicItem,
      parseMagicItemBaseWeapon(MACE_RAW_RESPONSE),
    );

    expect(firstRow).toEqual({
      key: 'baseDamage',
      label: MAGIC_ITEM_PROPERTY_LABELS.baseDamage,
      lines: ['1к6 дробящий (булава)'],
    });
  });

  it('у универсального оружия называет урон двуручного хвата', () => {
    const magicItem = createMagicItemDetail([FIRE_FORMULA]);

    expect(
      findPropertyLines(
        magicItem,
        MAGIC_ITEM_PROPERTY_LABELS.baseDamage,
        LONGSWORD_RAW_RESPONSE,
      ),
    ).toEqual(['1к8 рубящий, двумя руками 1к10 рубящий (длинный меч)']);
  });

  it('без основы строки основного урона нет', () => {
    const magicItem = createMagicItemDetail([FIRE_FORMULA]);

    expect(
      findPropertyLines(magicItem, MAGIC_ITEM_PROPERTY_LABELS.baseDamage),
    ).toBeUndefined();
  });
});

describe('немагическая основа магического предмета', () => {
  it('читает слаги основы из «сырого» ответа раздела', () => {
    expect(parseMagicItemBaseItemUrls({ items: [MACE_URL] })).toEqual([
      MACE_URL,
    ]);

    expect(parseMagicItemBaseItemUrls({})).toEqual([]);
    expect(parseMagicItemBaseItemUrls(null)).toEqual([]);
  });

  it('предмет без урона оружия основой не считается', () => {
    expect(
      parseMagicItemBaseWeapon({ name: { rus: 'Плащ' }, weapon: null }),
    ).toBeUndefined();

    expect(parseMagicItemBaseWeapon(undefined)).toBeUndefined();
  });

  it('основу догружает только предмет с оружейными свойствами', () => {
    expect(
      hasMagicItemWeaponProperties(createMagicItemDetail([FIRE_FORMULA])),
    ).toBe(true);

    expect(hasMagicItemWeaponProperties(createMagicItemDetail([]))).toBe(false);

    expect(
      hasMagicItemWeaponProperties({
        ...createMagicItemDetail([]),
        bonuses: { attack: 1, damage: 1, armorClass: 0 },
      }),
    ).toBe(true);

    expect(
      hasMagicItemWeaponProperties({
        ...createMagicItemDetail([]),
        bonuses: { attack: 0, damage: 0, armorClass: 1 },
      }),
    ).toBe(false);
  });

  it('ключ запроса зависит от слагов основы', () => {
    expect(
      getMagicItemBaseWeaponDataKey(MACE_OF_DISRUPTION_URL, undefined),
    ).not.toBe(
      getMagicItemBaseWeaponDataKey(MACE_OF_DISRUPTION_URL, [MACE_URL]),
    );
  });
});
