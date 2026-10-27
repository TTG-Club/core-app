import type { CreateAction } from '~bestiary/model';

import { describe, expect, it } from 'vitest';

import {
  createEmptyCreatureAction,
  CREATURE_ACTION_EFFECT_CONTEXTS,
  normalizeCreatureActions,
  toStoredSaveSuccessPerDay,
} from '~bestiary/model';

/** «Легендарное сопротивление (3/день)». */
const LEGENDARY_RESISTANCE_PER_DAY = 3;

/** Больше раз в день не бывает. */
const MAX_SAVE_SUCCESS_PER_DAY = 20;

/**
 * Черта «Легендарное сопротивление».
 *
 * @param saveSuccessPerDay раз в день.
 * @returns запись черты.
 */
function createLegendaryResistance(saveSuccessPerDay: number): CreateAction {
  return {
    ...createEmptyCreatureAction(),
    name: { rus: 'Легендарное сопротивление', eng: 'Legendary Resistance' },
    saveSuccessPerDay,
  };
}

describe('провал в успех у черты существа (saveSuccessPerDay)', () => {
  it('пишется только у черты', () => {
    const trait = createLegendaryResistance(LEGENDARY_RESISTANCE_PER_DAY);

    expect(
      normalizeCreatureActions(
        [trait],
        CREATURE_ACTION_EFFECT_CONTEXTS.traits,
      )[0]?.saveSuccessPerDay,
    ).toBe(LEGENDARY_RESISTANCE_PER_DAY);

    expect(
      normalizeCreatureActions(
        [trait],
        CREATURE_ACTION_EFFECT_CONTEXTS.actions,
      )[0]?.saveSuccessPerDay,
    ).toBeUndefined();
  });

  it('ноль и пусто — поля нет, больше предела — предел', () => {
    expect(toStoredSaveSuccessPerDay(0)).toBeUndefined();
    expect(toStoredSaveSuccessPerDay(undefined)).toBeUndefined();
    expect(toStoredSaveSuccessPerDay('3')).toBe(LEGENDARY_RESISTANCE_PER_DAY);

    expect(toStoredSaveSuccessPerDay(MAX_SAVE_SUCCESS_PER_DAY + 5)).toBe(
      MAX_SAVE_SUCCESS_PER_DAY,
    );
  });
});
