import type { EffectModifierPreset } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  ACTIVE_EFFECT_LABELS,
  conditionHolds,
  describeEffectChange,
  describeEffectChangeCondition,
  describeEffectChangeConditionWarning,
  describeEffectChangeValueError,
  describeEffectChangeValueNote,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_SECTIONS,
  EFFECT_MODIFIER_MENU,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  hasConditionAlternatives,
  isEffectModifierSubmenu,
  isRollDiceEffectChange,
  isSneakAttackKey,
  joinConditionGroups,
  readTriggerConditionParts,
  SNEAK_ATTACK_APPLIED_CONDITION,
  SNEAK_ATTACK_CONDITION,
  SNEAK_ATTACK_CREATURE_CONDITION,
  SNEAK_ATTACK_DAMAGE_KEY,
  SNEAK_ATTACK_DICE_FORMULA,
  SNEAK_ATTACK_DICE_KEY,
  splitConditionGroups,
  writeTriggerCondition,
} from '~active-effects/model';
import {
  getConditionalDamageFormulas,
  getEffectBonusTarget,
  matchesArmorCondition,
  matchesAttackAbilityCondition,
  resolveSheetEffects,
  toInventoryBonusesFromEffects,
} from '~character-sheet/model';

import { createAddChange, createEffect } from './fixtures';

/**
 * Скрытая атака, этап 1 — зеркало `tests/sneakAttack.test.mjs` и
 * `tests/effectLibrarySections.test.mjs` системы в части словаря: «или» в
 * условиях, новые атомы и ключи, готовые пункты меню. Лист сайта Скрытую атаку
 * не считает, но и не ломается на ней.
 */

/** Условие Скрытой атаки системы — строкой, ровно как в данных. */
const SYSTEM_SNEAK_ATTACK_CONDITION =
  'weapon.property === "finesse" && roll.hasAdvantage === true'
  + ' || weapon.property === "finesse" && target.allyAdjacent && roll.hasDisadvantage === false'
  + ' || weapon.rangeType === "ranged" && roll.hasAdvantage === true'
  + ' || weapon.rangeType === "ranged" && target.allyAdjacent && roll.hasDisadvantage === false';

/** Кости Скрытой атаки плута в системе. */
const SYSTEM_SNEAK_ATTACK_DICE =
  '(1 + steps(@classLevel, 3, 5, 7, 9, 11, 13, 15, 17, 19))к6';

/** Подпись готового условия по правилам. */
const SNEAK_ATTACK_CONDITION_LABEL = 'Скрытая атака: условие по правилам';

/**
 * Готовые строки меню модификаторов (без подменю).
 *
 * @returns готовые строки всех разделов.
 */
function listReadyPresets(): EffectModifierPreset[] {
  return EFFECT_MODIFIER_MENU.flatMap((menuGroup) => menuGroup.items).filter(
    (menuItem): menuItem is EffectModifierPreset =>
      !isEffectModifierSubmenu(menuItem),
  );
}

describe('«или» в условиях', () => {
  it('группы «или» с частями «и»: «и» связывает сильнее', () => {
    expect(splitConditionGroups('a && b || c')).toEqual([['a', 'b'], ['c']]);
    expect(splitConditionGroups(' a ')).toEqual([['a']]);
    expect(splitConditionGroups('a || || b')).toEqual([['a'], ['b']]);
    expect(splitConditionGroups('')).toEqual([]);

    expect(hasConditionAlternatives('a && b')).toBe(false);
    expect(hasConditionAlternatives('a || b')).toBe(true);
  });

  it('выполнено, когда выполнена хоть одна группа целиком', () => {
    const known = new Set(['a', 'c']);
    const holds = (part: string): boolean => known.has(part);

    expect(conditionHolds('a && b || c', holds)).toBe(true);
    expect(conditionHolds('a && b || b', holds)).toBe(false);
    expect(conditionHolds('a && c', holds)).toBe(true);
    expect(conditionHolds('', holds)).toBe(false);
  });

  it('сборка и разбор — одна и та же строка', () => {
    const groups = [['a', 'b'], [], ['c']];

    expect(joinConditionGroups(groups)).toBe('a && b || c');

    expect(splitConditionGroups(joinConditionGroups(groups))).toEqual([
      ['a', 'b'],
      ['c'],
    ]);
  });

  it('подпись: группы через «или», части через «и»', () => {
    expect(
      describeEffectChangeCondition(
        'roll.hasAdvantage === true || target.markedBySelf',
      ),
    ).toBe(
      'Бросок: уже идёт с преимуществом или Цель помечена мной (Метка охотника, Сглаз)',
    );

    expect(
      describeEffectChangeCondition(
        'weapon.property === "finesse" && roll.hasDisadvantage === false || weapon.rangeType === "ranged"',
      ),
    ).toBe(
      'Оружие: фехтовальное и Бросок: без помехи или Оружие: дальнобойное',
    );
  });

  it('условие целиком из словаря читается своей подписью', () => {
    expect(describeEffectChangeCondition(SNEAK_ATTACK_CONDITION)).toBe(
      SNEAK_ATTACK_CONDITION_LABEL,
    );

    expect(describeEffectChangeCondition(`  ${SNEAK_ATTACK_CONDITION} `)).toBe(
      SNEAK_ATTACK_CONDITION_LABEL,
    );
  });

  it('срабатывание: условие с «или» читается одной строкой как есть', () => {
    expect(readTriggerConditionParts(' a && b || c ')).toEqual(['a && b || c']);
  });

  it('срабатывание: часть с «или» умножает группы', () => {
    expect(
      writeTriggerCondition([
        'roll.hasAdvantage === true || roll.hasDisadvantage === true',
        { kind: 'attackLanded' },
      ]),
    ).toBe(
      'roll.hasAdvantage === true && attack.landed === true'
        + ' || roll.hasDisadvantage === true && attack.landed === true',
    );

    // Строка из формы с «или» возвращается без изменений
    const condition = 'a && b || c';

    expect(writeTriggerCondition(readTriggerConditionParts(condition))).toBe(
      condition,
    );

    expect(writeTriggerCondition(['', ' || '])).toBeUndefined();
  });
});

describe('словарь Скрытой атаки', () => {
  it('готовое условие — ровно строка системы', () => {
    expect(SNEAK_ATTACK_CONDITION).toBe(SYSTEM_SNEAK_ATTACK_CONDITION);
    expect(SNEAK_ATTACK_DICE_FORMULA).toBe(SYSTEM_SNEAK_ATTACK_DICE);
    expect(splitConditionGroups(SNEAK_ATTACK_CONDITION)).toHaveLength(4);
  });

  it('новые атомы — в разделе «Бросок и атака» с подписями системы', () => {
    const labels = new Map(
      EFFECT_CONDITION_EXPR_SUGGESTIONS.filter(
        (suggestion) => suggestion.section === EFFECT_CONDITION_SECTIONS.roll,
      ).map((suggestion) => [suggestion.value, suggestion.label]),
    );

    expect(labels.get('roll.hasDisadvantage === false')).toBe(
      'Бросок: без помехи',
    );

    expect(labels.get('weapon.property === "finesse"')).toBe(
      'Оружие: фехтовальное',
    );

    expect(labels.get('weapon.rangeType === "ranged"')).toBe(
      'Оружие: дальнобойное',
    );

    expect(labels.get(SNEAK_ATTACK_APPLIED_CONDITION)).toBe(
      'Атака: идёт Скрытая атака',
    );

    expect(labels.get(SYSTEM_SNEAK_ATTACK_CONDITION)).toBe(
      SNEAK_ATTACK_CONDITION_LABEL,
    );
  });

  it('ключи строки с подписями системы', () => {
    const labels = new Map(
      EFFECT_TARGET_KEY_SUGGESTIONS.map((suggestion) => [
        suggestion.value,
        suggestion.label,
      ]),
    );

    expect(labels.get('sneakAttack.damage')).toBe(
      'Скрытая атака: кости (раз в ход, можно не добавлять)',
    );

    expect(labels.get('sneakAttack.dice')).toBe(
      'Скрытая атака: прибавка к числу костей',
    );

    expect(isSneakAttackKey(SNEAK_ATTACK_DAMAGE_KEY)).toBe(true);
    expect(isSneakAttackKey(SNEAK_ATTACK_DICE_KEY)).toBe(true);
    expect(isSneakAttackKey('damage.weapon')).toBe(false);
  });

  it('проверка формы: кость у костей Скрытой атаки допустима', () => {
    const damage = createAddChange(
      SNEAK_ATTACK_DAMAGE_KEY,
      SNEAK_ATTACK_DICE_FORMULA,
      SNEAK_ATTACK_CONDITION,
    );

    expect(describeEffectChangeValueError(damage)).toBeUndefined();

    expect(
      describeEffectChangeValueError(
        createAddChange(SNEAK_ATTACK_DICE_KEY, '1'),
      ),
    ).toBeUndefined();

    // Кости — урон: пояснение «бросается заново» к ним не относится
    expect(isRollDiceEffectChange(damage)).toBe(false);

    expect(describeEffectChangeValueNote(damage)).toBe(
      ACTIVE_EFFECT_LABELS.changeSneakAttackDamageHint,
    );

    expect(
      describeEffectChangeValueNote(
        createAddChange(SNEAK_ATTACK_DICE_KEY, '1'),
      ),
    ).toBe(ACTIVE_EFFECT_LABELS.changeSneakAttackDiceHint);

    expect(
      describeEffectChangeValueNote(createAddChange('attack.melee', '1к4')),
    ).toBe(ACTIVE_EFFECT_LABELS.changeRollDiceHint);
  });

  it('описание строки: ключ, кости и условие по правилам', () => {
    const description = describeEffectChange(
      createAddChange(
        SNEAK_ATTACK_DAMAGE_KEY,
        SNEAK_ATTACK_DICE_FORMULA,
        SNEAK_ATTACK_CONDITION,
      ),
    );

    expect(description).toContain('Скрытая атака: кости');
    expect(description).toContain(`(только: ${SNEAK_ATTACK_CONDITION_LABEL})`);
  });

  it('готовые пункты меню — как в системе', () => {
    const presets = listReadyPresets();

    expect(
      presets.find(
        (preset) =>
          preset.label === 'Скрытая атака: 1к6 → 10к6 по уровню плута',
      ),
    ).toEqual({
      key: SNEAK_ATTACK_DAMAGE_KEY,
      label: 'Скрытая атака: 1к6 → 10к6 по уровню плута',
      mode: 'add',
      value: SYSTEM_SNEAK_ATTACK_DICE,
      condition: SYSTEM_SNEAK_ATTACK_CONDITION,
    });

    expect(
      presets.find(
        (preset) => preset.label === 'Скрытая атака: +1к6 к её костям',
      ),
    ).toEqual({
      key: SNEAK_ATTACK_DICE_KEY,
      label: 'Скрытая атака: +1к6 к её костям',
      mode: 'add',
      value: '1',
    });

    expect(
      presets.find(
        (preset) =>
          preset.label === 'Урон предмета: +1к6, если идёт Скрытая атака',
      ),
    ).toEqual({
      key: 'damage.weapon',
      label: 'Урон предмета: +1к6, если идёт Скрытая атака',
      mode: 'add',
      value: '1к6',
      condition: 'attack.sneakAttack === true',
    });
  });
});

describe('лист сайта и Скрытая атака', () => {
  it('условие с «или» не идёт в постоянные числа', () => {
    const unarmored = { hasShield: false };

    expect(matchesArmorCondition('self.armor === "none"', unarmored)).toBe(
      true,
    );

    expect(
      matchesArmorCondition(
        'self.armor === "none" || self.armor === "light"',
        unarmored,
      ),
    ).toBe(false);

    expect(
      matchesAttackAbilityCondition(
        'attack.ability === "strength" || attack.ability === "dexterity"',
        'strength',
      ),
    ).toBe(false);
  });

  it('ключи Скрытой атаки лист пропускает, не падая', () => {
    const effect = createEffect({
      changes: [
        createAddChange(
          SNEAK_ATTACK_DAMAGE_KEY,
          SNEAK_ATTACK_DICE_FORMULA,
          SNEAK_ATTACK_CONDITION,
        ),
        createAddChange(SNEAK_ATTACK_DICE_KEY, '1'),
        createAddChange('damage.weapon', '1к6', SNEAK_ATTACK_APPLIED_CONDITION),
      ],
    });

    expect(getEffectBonusTarget(SNEAK_ATTACK_DAMAGE_KEY)).toBeNull();
    expect(getEffectBonusTarget(SNEAK_ATTACK_DICE_KEY)).toBeNull();
    expect(toInventoryBonusesFromEffects([effect])).toEqual([]);

    const resolved = resolveSheetEffects([effect]);

    for (const attackType of ['melee', 'ranged'] as const) {
      expect(
        getConditionalDamageFormulas(resolved, { kind: 'attack', attackType }),
      ).toEqual([]);
    }
  });
});

describe('доработки после ревью', () => {
  it('условие Скрытой атаки существа — без частей про оружие', () => {
    expect(SNEAK_ATTACK_CREATURE_CONDITION).toBe(
      'roll.hasAdvantage === true || target.allyAdjacent && roll.hasDisadvantage === false',
    );
  });

  it('«или» у ключа листа помечается предупреждением', () => {
    const warn = (key: string, condition: string) =>
      describeEffectChangeConditionWarning({ key, condition });

    expect(
      warn('armorClass', 'self.armor === "light" || self.armor === "medium"'),
    ).toBeDefined();

    expect(
      warn('movement.walk', 'self.armor === "none" || self.armor === "light"'),
    ).toBeDefined();

    expect(
      warn(
        'armorClass',
        'incoming.attackType === "ranged" || incoming.attackType === "spell"',
      ),
    ).toBeUndefined();

    expect(
      warn('damage.melee', 'roll.hasAdvantage === true || x'),
    ).toBeUndefined();

    expect(warn('armorClass', 'self.armor === "light"')).toBeUndefined();
  });
});
