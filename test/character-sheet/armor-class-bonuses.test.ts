import type { Character, CharacterCustomBonus } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  ARMOR_CLASS_LABELS,
  DEFAULT_CHARACTER,
  getArmorClassBreakdown,
  getArmorClassBreakdownRows,
  getArmorClassValue,
  NEW_CUSTOM_BONUS,
  parseCharacter,
} from '~character-sheet/model';

/** Идентификатор листа в тестах. */
const SHEET_ID = 'sheet';

/**
 * Свой бонус к КД с пометкой.
 *
 * @param fields поля бонуса поверх нового своего бонуса.
 * @returns свой бонус.
 */
function createBonus(
  fields: Partial<CharacterCustomBonus> & Pick<CharacterCustomBonus, 'id'>,
): CharacterCustomBonus {
  return { ...NEW_CUSTOM_BONUS, ...fields };
}

/**
 * Персонаж с Ловкостью 14 (+2) и своими бонусами к КД.
 *
 * @param bonuses свои бонусы к КД.
 * @param custom взято ли ручное значение КД.
 * @returns персонаж.
 */
function createCharacter(
  bonuses: CharacterCustomBonus[],
  custom: boolean = false,
): Character {
  return {
    ...structuredClone(DEFAULT_CHARACTER),
    abilities: { ...DEFAULT_CHARACTER.abilities, dexterity: 14 },
    armorClass: {
      ...structuredClone(DEFAULT_CHARACTER.armorClass),
      base: 15,
      custom,
      bonuses,
    },
  };
}

const SHIELD_SPELL = createBonus({ id: 'shield', value: 5, label: 'Щит' });
const MAGE_ARMOR = createBonus({ id: 'mage', value: 3, label: 'Доспехи мага' });

describe('свои бонусы к классу доспеха', () => {
  it('без бонусов КД считается как раньше: 10 + Ловкость', () => {
    expect(getArmorClassValue(createCharacter([]))).toBe(12);
  });

  it('бонусы с пометкой прибавляются к автоподсчёту и видны в разборе', () => {
    const character = createCharacter([SHIELD_SPELL, MAGE_ARMOR]);
    const breakdown = getArmorClassBreakdown(character);

    expect(breakdown.value).toBe(20);
    expect(breakdown.customBonus).toBe(8);

    expect(breakdown.customBonuses).toEqual([
      { id: 'shield', name: 'Щит', value: 5 },
      { id: 'mage', name: 'Доспехи мага', value: 3 },
    ]);
  });

  it('бонусы идут и в ручное значение КД: 15 + Ловкость + Щит', () => {
    expect(getArmorClassValue(createCharacter([SHIELD_SPELL], true))).toBe(22);
  });

  it('выключенный бонус хранится, но в КД и разбор не идёт', () => {
    const character = createCharacter([
      { ...SHIELD_SPELL, disabled: true },
      MAGE_ARMOR,
    ]);

    const breakdown = getArmorClassBreakdown(character);

    expect(breakdown.value).toBe(15);

    expect(breakdown.customBonuses.map((bonus) => bonus.name)).toEqual([
      'Доспехи мага',
    ]);
  });

  it('бонус от характеристики берёт её модификатор', () => {
    const character = createCharacter([
      createBonus({ id: 'dex', kind: 'ability', ability: 'dexterity' }),
    ]);

    expect(getArmorClassValue(character)).toBe(14);
  });

  it('строки разбора называют щит, предмет и свой бонус', () => {
    const character = parseCharacter(
      {
        ...createCharacter([SHIELD_SPELL]),
        inventory: [
          {
            id: 'shield-item',
            name: 'Щит +1',
            equipped: true,
            quantity: 1,
            armor: { baseArmorClass: 3, shield: true },
          },
          {
            id: 'ring',
            name: 'Кольцо защиты',
            equipped: true,
            quantity: 1,
            armorClassBonus: 1,
          },
        ],
      },
      SHEET_ID,
    );

    const breakdown = getArmorClassBreakdown(character);
    const rows = getArmorClassBreakdownRows(breakdown);

    expect(breakdown.value).toBe(12 + 3 + 1 + 5);

    expect(
      rows.map(({ label, name, formattedValue }) => [
        label,
        name,
        formattedValue,
      ]),
    ).toEqual([
      [ARMOR_CLASS_LABELS.shieldTitle, 'Щит +1', '+3'],
      [ARMOR_CLASS_LABELS.itemTitle, 'Кольцо защиты', '+1'],
      [ARMOR_CLASS_LABELS.customBonusTitle, 'Щит', '+5'],
    ]);
  });
});

describe('чтение своих бонусов к КД из записи листа', () => {
  it('старый лист без поля читается с пустым списком', () => {
    const { bonuses, ...legacyArmorClass } = DEFAULT_CHARACTER.armorClass;

    const character = parseCharacter(
      { ...structuredClone(DEFAULT_CHARACTER), armorClass: legacyArmorClass },
      SHEET_ID,
    );

    expect(bonuses).toEqual([]);
    expect(character.armorClass.bonuses).toEqual([]);
    expect(getArmorClassValue(character)).toBe(10);
  });

  it('пометка и выключатель бонуса переживают сохранение', () => {
    const character = parseCharacter(
      createCharacter([{ ...SHIELD_SPELL, disabled: true }]),
      SHEET_ID,
    );

    expect(character.armorClass.bonuses).toEqual([
      { ...SHIELD_SPELL, disabled: true },
    ]);
  });

  it('бонус без выключателя остаётся включённым', () => {
    const character = parseCharacter(createCharacter([SHIELD_SPELL]), SHEET_ID);

    expect(character.armorClass.bonuses[0]?.disabled).toBeUndefined();
    expect(getArmorClassValue(character)).toBe(17);
  });
});
