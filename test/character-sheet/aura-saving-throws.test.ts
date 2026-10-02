import type { ActiveEffect } from '~active-effects/model';
import type { Character, CharacterFeature } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import { DEFAULT_EFFECT_CHANGE_PRIORITY } from '~active-effects/model';
import {
  DEFAULT_CHARACTER,
  getSavingThrowValue,
  isSelfAppliedEffect,
} from '~character-sheet/model';

import {
  ALL_CREATURES_AURA,
  ALLIES_AURA,
  AURA_OF_PROTECTION_FORMULA,
  createEffect,
  MIN_AURA_OF_PROTECTION_BONUS,
} from '../active-effects/fixtures';

/** Харизма паладина в тестах: модификатор +3. */
const PALADIN_CHARISMA = 16;

/** Модификатор Харизмы паладина. */
const PALADIN_CHARISMA_MODIFIER = 3;

/** Харизма с отрицательным модификатором: аура даёт наименьшую прибавку. */
const LOW_CHARISMA = 8;

/** Спасбросок Мудрости без прибавок: Мудрость 10, владения нет. */
const PLAIN_WISDOM_SAVING_THROW = 0;

/**
 * Эффект «Аура защиты»: прибавка к спасброску Мудрости формулой, аура действует
 * и на носителя.
 *
 * @param overrides поля, отличные от умолчания.
 * @returns активный эффект умения.
 */
function createAuraEffect(overrides: Partial<ActiveEffect> = {}): ActiveEffect {
  return createEffect({
    name: 'Аура защиты',
    changes: [
      {
        key: 'save.wisdom',
        mode: 'add',
        value: AURA_OF_PROTECTION_FORMULA,
        priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
      },
    ],
    aura: ALLIES_AURA,
    ...overrides,
  });
}

/**
 * Паладин с умением «Аура защиты».
 *
 * @param charisma значение Харизмы.
 * @param auraEffect эффект умения.
 * @returns персонаж.
 */
function createPaladin(charisma: number, auraEffect: ActiveEffect): Character {
  const auraFeature: CharacterFeature = {
    id: 'class:aura-of-protection',
    name: auraEffect.name,
    description: [],
    origin: 'class',
    originName: '',
    level: null,
    choice: null,
    activeEffects: [auraEffect],
  };

  return {
    ...DEFAULT_CHARACTER,
    abilities: { ...DEFAULT_CHARACTER.abilities, charisma },
    features: [auraFeature],
  };
}

/**
 * Спасбросок Мудрости персонажа.
 *
 * @param character персонаж.
 * @returns значение спасброска; `undefined` — записи спасброска нет.
 */
function getWisdomSavingThrow(character: Character): number | undefined {
  const wisdomSavingThrow = character.savingThrows.find(
    (savingThrow) => savingThrow.key === 'wisdom',
  );

  return wisdomSavingThrow
    ? getSavingThrowValue(character, wisdomSavingThrow)
    : undefined;
}

describe('isSelfAppliedEffect', () => {
  it('считает ауру, действующую и на носителя', () => {
    expect(isSelfAppliedEffect(createAuraEffect())).toBe(true);
  });

  it('пропускает ауру только для окружающих', () => {
    expect(
      isSelfAppliedEffect(createAuraEffect({ aura: ALL_CREATURES_AURA })),
    ).toBe(false);
  });

  it('пропускает выключенную ауру', () => {
    expect(isSelfAppliedEffect(createAuraEffect({ disabled: true }))).toBe(
      false,
    );
  });
});

describe('getSavingThrowValue с «Аурой защиты»', () => {
  it('прибавляет модификатор Харизмы к спасброску', () => {
    expect(
      getWisdomSavingThrow(createPaladin(PALADIN_CHARISMA, createAuraEffect())),
    ).toBe(PALADIN_CHARISMA_MODIFIER);
  });

  it('прибавляет наименьшую прибавку при низкой Харизме', () => {
    expect(
      getWisdomSavingThrow(createPaladin(LOW_CHARISMA, createAuraEffect())),
    ).toBe(MIN_AURA_OF_PROTECTION_BONUS);
  });

  it('не прибавляет ничего от выключенной ауры', () => {
    expect(
      getWisdomSavingThrow(
        createPaladin(PALADIN_CHARISMA, createAuraEffect({ disabled: true })),
      ),
    ).toBe(PLAIN_WISDOM_SAVING_THROW);
  });

  it('не прибавляет ничего от ауры только для окружающих', () => {
    expect(
      getWisdomSavingThrow(
        createPaladin(
          PALADIN_CHARISMA,
          createAuraEffect({ aura: ALL_CREATURES_AURA }),
        ),
      ),
    ).toBe(PLAIN_WISDOM_SAVING_THROW);
  });
});
