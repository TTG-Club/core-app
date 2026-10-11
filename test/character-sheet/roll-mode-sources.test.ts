import type { ActiveEffect } from '~active-effects/model';
import type { Character, InventoryWeapon } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  getSheetRollModeSources,
  getWeaponAttackBonus,
  getWeaponAttackRollModeSources,
} from '~character-sheet/model';

const GREATSWORD: InventoryWeapon = {
  category: 'martial',
  ranged: false,
  finesse: false,
  heavy: true,
  attackBonus: 0,
  damage: { diceCount: 2, diceFaces: 6, bonus: 0, type: 'SLASHING' },
  versatileDamage: null,
  extraDamage: null,
};

/**
 * Постоянный эффект с флагами — как состояние, наложенное на персонажа.
 *
 * @param name название эффекта.
 * @param flags флаги эффекта.
 * @returns эффект.
 */
function buildFlagEffect(name: string, flags: string[]): ActiveEffect {
  return {
    id: `effect-${name}`,
    name,
    description: '',
    disabled: false,
    origin: 'feature',
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags,
    effectTarget: 'self',
  };
}

/**
 * Персонаж с наложенными эффектами.
 *
 * @param effects эффекты на персонаже.
 * @returns персонаж.
 */
function buildCharacter(effects: ActiveEffect[]): Character {
  return { ...structuredClone(DEFAULT_CHARACTER), activeEffects: effects };
}

describe('источники преимущества и помехи броска атаки', () => {
  it('называет состояние, дающее помеху атаке', () => {
    const character = buildCharacter([
      buildFlagEffect('Опутанный', ['attack.disadvantage']),
    ]);

    expect(
      getSheetRollModeSources(character, {
        kind: 'attack',
        attackType: 'melee',
      }),
    ).toEqual([{ label: 'Опутанный', mode: 'disadvantage' }]);
  });

  it('перечисляет взаимно гасящие источники и молчит о чужих бросках', () => {
    const character = buildCharacter([
      buildFlagEffect('Невидимый', ['attack.advantage']),
      buildFlagEffect('Отравленный', [
        'attack.disadvantage',
        'abilityCheck.disadvantage',
      ]),
      buildFlagEffect('Меткий глаз', ['attack.ranged.advantage']),
      {
        ...buildFlagEffect('Выключенный', ['attack.advantage']),
        disabled: true,
      },
    ]);

    expect(
      getSheetRollModeSources(character, {
        kind: 'attack',
        attackType: 'melee',
      }),
    ).toEqual([
      { label: 'Невидимый', mode: 'advantage' },
      { label: 'Отравленный', mode: 'disadvantage' },
    ]);
  });

  it('называет тяжёлое оружие не по руке', () => {
    const character: Character = {
      ...structuredClone(DEFAULT_CHARACTER),
      abilities: { ...DEFAULT_CHARACTER.abilities, strength: 8 },
    };

    const attack = getWeaponAttackBonus(character, GREATSWORD, true, null);

    expect(getWeaponAttackRollModeSources(attack)).toEqual([
      { label: 'Тяжёлое оружие: Сила меньше 13', mode: 'disadvantage' },
    ]);
  });
});
