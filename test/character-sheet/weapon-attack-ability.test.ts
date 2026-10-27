import type { Character, InventoryWeapon } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  getWeaponAttackBonus,
  getWeaponDamage,
  parseCharacter,
} from '~character-sheet/model';

const SICKLE: InventoryWeapon = {
  category: 'simple',
  ranged: false,
  finesse: false,
  heavy: false,
  attackBonus: 0,
  damage: { diceCount: 1, diceFaces: 4, bonus: 0, type: 'SLASHING' },
  versatileDamage: null,
  extraDamage: null,
};

const AGILE_CHARACTER: Character = {
  ...structuredClone(DEFAULT_CHARACTER),
  abilities: {
    ...DEFAULT_CHARACTER.abilities,
    strength: 10,
    dexterity: 16,
  },
};

describe('характеристика атаки, выбранная у оружия', () => {
  it('без выбора серп бьёт от Силы', () => {
    expect(
      getWeaponAttackBonus(AGILE_CHARACTER, SICKLE, false, null).ability,
    ).toBe('strength');
  });

  it('выбранная Ловкость идёт и в атаку, и в урон', () => {
    const attack = getWeaponAttackBonus(
      AGILE_CHARACTER,
      SICKLE,
      false,
      'dexterity',
    );

    const damage = getWeaponDamage(AGILE_CHARACTER, SICKLE, false, 'dexterity');

    expect(attack.ability).toBe('dexterity');
    expect(attack.value).toBe(3);
    expect(damage?.formula).toBe('1к4+3');
  });

  it('выбор переживает сохранение листа', () => {
    const [item] = parseCharacter(
      {
        ...AGILE_CHARACTER,
        inventory: [
          {
            id: 'sickle',
            name: 'Серп',
            weapon: SICKLE,
            attackAbility: 'dexterity',
          },
        ],
      },
      'sheet',
    ).inventory;

    expect(item?.attackAbility).toBe('dexterity');
  });
});
