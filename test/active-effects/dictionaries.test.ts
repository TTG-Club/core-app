import { describe, expect, it } from 'vitest';

import {
  ADJACENT_ALLY_CONDITION_OPTIONS,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_FLAG_LABELS,
  EFFECT_SYSTEM_VERSION,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_VALUE_SUGGESTIONS,
  isAdjacentAllyCondition,
} from '~active-effects/model';

/**
 * Размеры словарей системы dnd5e-2024 той версии, с которой снят порт. Тест
 * падает, когда справочник разошёлся с ней: либо в системе появилось новое (и
 * порт отстал), либо на сайте завелась своя запись, которой VTTG не знает.
 * Меняются числа только вместе с `EFFECT_SYSTEM_VERSION`; какие именно записи
 * разошлись, показывает `node scripts/compare-effect-dictionaries.mjs`.
 */
const SYSTEM_DICTIONARY_SIZES = {
  version: '0.8.81',
  flags: 200,
  changeKeys: 61,
  conditions: 93,
  values: 33,
};

describe('словари эффектов', () => {
  it('размеры совпадают с системой, с которой снят порт', () => {
    expect(EFFECT_SYSTEM_VERSION).toBe(SYSTEM_DICTIONARY_SIZES.version);

    expect(Object.keys(EFFECT_FLAG_LABELS)).toHaveLength(
      SYSTEM_DICTIONARY_SIZES.flags,
    );

    expect(EFFECT_TARGET_KEY_SUGGESTIONS).toHaveLength(
      SYSTEM_DICTIONARY_SIZES.changeKeys,
    );

    expect(EFFECT_CONDITION_EXPR_SUGGESTIONS).toHaveLength(
      SYSTEM_DICTIONARY_SIZES.conditions,
    );

    expect(EFFECT_VALUE_SUGGESTIONS).toHaveLength(
      SYSTEM_DICTIONARY_SIZES.values,
    );
  });

  it('новые ключи и флаги 0.8.62 на месте', () => {
    for (const flag of [
      'healing.blocked',
      'healing.tempBlocked',
      'attacksAgainst.spell.advantage',
      'save.advantage.vsSpell',
      'save.advantage.death',
      'save.negateOnSuccess.vsMagic',
      'save.evasion.dexterity',
      'damage.ignoreResistance.slashing',
    ]) {
      expect(EFFECT_FLAG_LABELS[flag], flag).toBeDefined();
    }

    const changeKeys = EFFECT_TARGET_KEY_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    expect(changeKeys).toContain('abilityCheck');
    expect(changeKeys).toContain('save.concentration');
    expect(changeKeys).toContain('attacksAgainst');
    expect(changeKeys).toContain('deathSave');
  });

  it('новые ключи и флаги 0.8.66 на месте', () => {
    for (const flag of [
      'defense.suppressAll',
      'hitPoints.maxReductionBlocked',
      'attacksAgainst.forceCritical',
      'movement.teleportBlocked',
      'rest.noBenefit.short',
      'rest.noBenefit.long',
    ]) {
      expect(EFFECT_FLAG_LABELS[flag], flag).toBeDefined();
    }

    const changeKeys = EFFECT_TARGET_KEY_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    for (const changeKey of [
      'creatureType',
      'damage.all',
      'damage.weapon',
      'attack.weapon',
    ]) {
      expect(changeKeys).toContain(changeKey);
    }
  });

  it('условия о союзнике рядом с целью — семейством, с распознаванием', () => {
    // Дееспособный, в любом состоянии и по пятнадцати состояниям в двух видах
    expect(ADJACENT_ALLY_CONDITION_OPTIONS).toHaveLength(32);

    const conditions = EFFECT_CONDITION_EXPR_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    expect(conditions).toContain('target.allyAdjacent');
    expect(conditions).toContain('target.allyAdjacentAny');
    expect(conditions).toContain('target.allyAdjacentWith === "poisoned"');
    expect(conditions).toContain('target.allyAdjacentWithout === "poisoned"');
    expect(conditions).toContain('incoming.attackerCreatureType === "fiend"');

    expect(isAdjacentAllyCondition('target.allyAdjacent')).toBe(true);
    expect(isAdjacentAllyCondition('  target.allyAdjacentAny  ')).toBe(true);

    expect(isAdjacentAllyCondition('target.allyAdjacentWith === "prone"')).toBe(
      true,
    );

    expect(isAdjacentAllyCondition('target.markedBySelf')).toBe(false);
  });
});
