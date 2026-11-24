import type {
  AbilityKey,
  Character,
  CharacterSavingThrow,
  CharacterSkill,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  ABILITY_ORDER,
  DEFAULT_CHARACTER,
  getAbilityCheckValue,
  getSavingThrowValue,
  getSkillValue,
  parseCharacter,
  SKILL_NAME_BY_API_KEY,
  toInventoryBonusesFromEffects,
} from '~character-sheet/model';

import { createAddChange, createEffect } from '../active-effects/fixtures';

/** Идентификатор листа в тестах. */
const SHEET_ID = 'sheet';

/** Навык, на котором проверяется прибавка. */
const STEALTH_SKILL_NAME = SKILL_NAME_BY_API_KEY.STEALTH;

/** Эффект «Камня удачи»: +1 к спасброску Ловкости и ко всем проверкам. */
const LUCKSTONE_EFFECT = createEffect({
  changes: [
    createAddChange('save.dexterity', '1'),
    createAddChange('abilityCheck', '1'),
  ],
});

/**
 * Собирает персонажа; с камнем — надетым, как его кладёт в инвентарь лист.
 *
 * @param withStone положить ли камень в инвентарь.
 * @returns персонаж, разобранный схемой листа.
 */
function createCharacter(withStone: boolean): Character {
  return parseCharacter(
    {
      ...structuredClone(DEFAULT_CHARACTER),
      inventory: withStone
        ? [
            {
              id: 'magic-item:stone-of-good-luck-dmg',
              name: 'Камень удачи',
              equipped: true,
              requiresAttunement: false,
              bonuses: toInventoryBonusesFromEffects([LUCKSTONE_EFFECT]),
              activeEffects: [LUCKSTONE_EFFECT],
            },
          ]
        : [],
    },
    SHEET_ID,
  );
}

/**
 * Навык персонажа по названию.
 *
 * @param character персонаж.
 * @param skillName название навыка.
 * @returns навык персонажа.
 */
function findSkill(character: Character, skillName: string): CharacterSkill {
  const skill = character.skills.find(
    (candidate) => candidate.name === skillName,
  );

  if (!skill) {
    throw new Error(`Навык «${skillName}» не найден`);
  }

  return skill;
}

/**
 * Спасбросок персонажа по характеристике.
 *
 * @param character персонаж.
 * @param ability характеристика спасброска.
 * @returns спасбросок персонажа.
 */
function findSavingThrow(
  character: Character,
  ability: AbilityKey,
): CharacterSavingThrow {
  const savingThrow = character.savingThrows.find(
    (candidate) => candidate.ability === ability,
  );

  if (!savingThrow) {
    throw new Error(`Спасбросок «${ability}» не найден`);
  }

  return savingThrow;
}

describe('бонус «ко всем проверкам» (Камень удачи)', () => {
  const characterWithoutStone = createCharacter(false);
  const characterWithStone = createCharacter(true);

  it.each(ABILITY_ORDER)(
    'прибавляет к проверке характеристики %s',
    (ability) => {
      expect(getAbilityCheckValue(characterWithStone, ability)).toBe(
        getAbilityCheckValue(characterWithoutStone, ability) + 1,
      );
    },
  );

  it('прибавляет к проверке навыка', () => {
    expect(
      getSkillValue(
        characterWithStone,
        findSkill(characterWithStone, STEALTH_SKILL_NAME),
      ),
    ).toBe(
      getSkillValue(
        characterWithoutStone,
        findSkill(characterWithoutStone, STEALTH_SKILL_NAME),
      ) + 1,
    );
  });

  it('спасброски, как и раньше, получают свою прибавку', () => {
    expect(
      getSavingThrowValue(
        characterWithStone,
        findSavingThrow(characterWithStone, 'dexterity'),
      ),
    ).toBe(
      getSavingThrowValue(
        characterWithoutStone,
        findSavingThrow(characterWithoutStone, 'dexterity'),
      ) + 1,
    );
  });
});
