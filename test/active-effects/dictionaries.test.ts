import { describe, expect, it } from 'vitest';

import {
  ADJACENT_ALLY_CONDITION_OPTIONS,
  buildConditionActiveEffect,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_TEMPLATES,
  EFFECT_FLAG_LABELS,
  EFFECT_MODIFIER_MENU,
  EFFECT_SYSTEM_VERSION,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_VALUE_SUGGESTIONS,
  isAdjacentAllyCondition,
  isEffectModifierSubmenu,
  parseWeaponBaseTypeCondition,
} from '~active-effects/model';

/**
 * Размеры словарей системы dnd5e-2024 той версии, с которой снят порт. Тест
 * падает, когда справочник разошёлся с ней: либо в системе появилось новое (и
 * порт отстал), либо на сайте завелась своя запись, которой VTTG не знает.
 * Меняются числа только вместе с `EFFECT_SYSTEM_VERSION`; какие именно записи
 * разошлись, показывает `node scripts/compare-effect-dictionaries.mjs`.
 */
const SYSTEM_DICTIONARY_SIZES = {
  version: '0.10.3',
  flags: 234,
  changeKeys: 78,
  conditions: 121,
  values: 51,
};

/**
 * Подсказки значений, которых нет в списке системы. Голый токен круга ячейки
 * `@castLevel` VTTG понимает в формулах эффектов заклинания, но подсказкой
 * предлагает только внутри формул («(@castLevel)к10»). Токены потраченного
 * ценой ресурсом и чисел получателя система называет только в пояснениях к
 * полям — сайт предлагает их строками библиотеки.
 */
const SITE_ONLY_VALUE_SUGGESTIONS = [
  '@castLevel',
  '@paid.slotLevel',
  '@paid.hitDice',
  '@paid.hitDie',
  '@paid.hitDiceRoll',
  '@paid.counter',
  '@paid.itemUses',
  '(1 + @paid.slotLevel)к8',
  '@paid.hitDiceRoll * even(@paid.hitDiceRoll)',
  '@hp.temp',
  'ceil(@hitDice.left / 2)',
  '(@tag.pressure)к8',
  '2к12@dmg.event',
  '@mod.feat',
];

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
      SYSTEM_DICTIONARY_SIZES.values + SITE_ONLY_VALUE_SUGGESTIONS.length,
    );

    const suggestedValues = EFFECT_VALUE_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    for (const siteValue of SITE_ONLY_VALUE_SUGGESTIONS) {
      expect(suggestedValues, siteValue).toContain(siteValue);
    }
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

  it('замены свойств оружия 0.8.96 на месте', () => {
    const changeKeys = EFFECT_TARGET_KEY_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    for (const changeKey of [
      'weapon.damageDice',
      'weapon.attackAbility',
      'weapon.damageType',
    ]) {
      expect(changeKeys).toContain(changeKey);
    }

    expect(
      EFFECT_CONDITION_EXPR_SUGGESTIONS.map((suggestion) => suggestion.value),
    ).toContain('weapon.baseType === "club, quarterstaff"');

    expect(
      parseWeaponBaseTypeCondition('weapon.baseType === "club, quarterstaff"'),
    ).toEqual(['club', 'quarterstaff']);

    expect(parseWeaponBaseTypeCondition('attack.ability === "strength"')).toBe(
      undefined,
    );
  });

  it('условия о союзнике рядом с целью — семейством, с распознаванием', () => {
    // Дееспособный, в любом состоянии и по восемнадцати состояниям в двух видах
    expect(ADJACENT_ALLY_CONDITION_OPTIONS).toHaveLength(38);

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

  it('левитация, падение, «убран со сцены», провал и прыжок 0.10 на месте', () => {
    for (const flag of [
      'movement.levitate',
      'movement.hover',
      'fall.featherFall',
      'scene.offScene',
      'terrain.impassable',
    ]) {
      expect(EFFECT_FLAG_LABELS[flag], flag).toBeDefined();
    }

    const changeKeys = EFFECT_TARGET_KEY_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    expect(changeKeys).toContain('jump.long');
    expect(changeKeys).toContain('jump.high');
    expect(changeKeys).toContain('jump.cost');
  });

  it('прыжок — среди скоростей, местность — своим разделом и «заменить»', () => {
    const findPreset = (key: string) =>
      EFFECT_MODIFIER_MENU.flatMap((group) =>
        group.items
          .filter((menuItem) => !isEffectModifierSubmenu(menuItem))
          .map((menuItem) => ({ group: group.label, ...menuItem })),
      ).find((menuItem) => menuItem.key === key && !menuItem.condition);

    expect(findPreset('jump.long')).toMatchObject({
      group: 'Скорости',
      mode: 'add',
    });

    expect(findPreset('jump.cost')).toMatchObject({
      group: 'Скорости',
      mode: 'override',
    });

    // Прибавка к цене клетки у VTTG дала бы «+2 к обычной», то есть ×3
    expect(findPreset('terrain.movementCost')).toMatchObject({
      group: 'Местность (только для зоны сцены)',
      mode: 'override',
      value: '2',
    });
  });

  it('шаблоны «В засаде» и «Застигнутый врасплох» несут свои срабатывания', () => {
    const hidden = buildConditionActiveEffect('hidden');

    expect(hidden?.name).toBe('В засаде');
    expect(hidden?.consumeOn).toBe('carrierAttack');
    expect(hidden?.flags).not.toContain('vision.invisible');

    expect(hidden?.triggers).toEqual([
      {
        id: 'hidden.verbalSpell',
        event: 'spellCast',
        condition: 'spell.verbal === true',
        actions: [{ type: 'removeSelf' }],
      },
    ]);

    const surprised = buildConditionActiveEffect('surprised');

    expect(surprised?.flags).toEqual(['initiative.disadvantage']);
    expect(surprised?.triggers?.[0]?.event).toBe('turnStart');

    expect(EFFECT_CONDITION_TEMPLATES.map((template) => template.key)).toEqual(
      expect.arrayContaining(['hidden', 'surprised']),
    );
  });
});
