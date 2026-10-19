import type { EffectChange, EffectModifierPreset } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  ACTIVE_EFFECT_LABELS,
  describeChangeOptionValue,
  describeEffectChangeValueError,
  describeEffectChangeValueNote,
  EFFECT_ABILITY_OPTIONS,
  EFFECT_MODIFIER_MENU,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  getChangeValueOptions,
  isEffectModifierSubmenu,
  isOptionValueKey,
  isSneakAttackKey,
} from '~active-effects/model';
import { CREATURE_SAVE_EFFECT_OPTIONS } from '~bestiary/editor/constants';
import { parseLoadedCreatureActionEffect } from '~bestiary/model';
import { WEAPON_SAVE_EFFECT_OPTIONS } from '~items/model';
import { SPELL_SAVE_EFFECT_OPTIONS } from '~spells/model';

/**
 * «Смертельный удар» Убийцы: ключ `sneakAttack.saveDouble` (значение —
 * характеристика спасброска цели) и исход спасброска «провал — урон удвоен».
 * Строки — ровно как в системе dnd5e-2024.
 */

/** Ключ строки «Смертельного удара» в системе. */
const SAVE_DOUBLE_KEY = 'sneakAttack.saveDouble';

/** Подпись исхода спасброска «провал удваивает урон» в системе. */
const SYSTEM_DOUBLE_LABEL = 'Провал — урон удвоен';

/**
 * Строка «Добавить» ключа «Смертельного удара».
 *
 * @param value значение строки.
 * @returns строка модификатора.
 */
function saveDoubleChange(value: string): EffectChange {
  return { key: SAVE_DOUBLE_KEY, mode: 'add', value, priority: 20 };
}

describe('смертельный удар: ключ строки', () => {
  it('подпись системы, ключ Скрытой атаки со значением из списка', () => {
    expect(
      EFFECT_TARGET_KEY_SUGGESTIONS.find(
        (suggestion) => suggestion.value === SAVE_DOUBLE_KEY,
      )?.label,
    ).toBe('Скрытая атака: спасбросок цели, провал — урон атаки удвоен');

    expect(isSneakAttackKey(SAVE_DOUBLE_KEY)).toBe(true);
    expect(isOptionValueKey(SAVE_DOUBLE_KEY)).toBe(true);

    expect(getChangeValueOptions(SAVE_DOUBLE_KEY)).toEqual(
      EFFECT_ABILITY_OPTIONS,
    );
  });

  it('значение — характеристика: подпись, пояснение и ошибка', () => {
    expect(describeChangeOptionValue(SAVE_DOUBLE_KEY, 'constitution')).toBe(
      'Телосложение',
    );

    expect(
      describeEffectChangeValueNote(saveDoubleChange('constitution')),
    ).toBe(ACTIVE_EFFECT_LABELS.changeSneakAttackSaveDoubleHint);

    expect(
      describeEffectChangeValueError(saveDoubleChange('constitution')),
    ).toBeUndefined();

    expect(describeEffectChangeValueError(saveDoubleChange('2'))).toBe(
      ACTIVE_EFFECT_LABELS.changeWeaponOptionError,
    );
  });

  it('готовый пункт меню — как в системе', () => {
    const expected: EffectModifierPreset = {
      key: SAVE_DOUBLE_KEY,
      label:
        'Смертельный удар: спасбросок Телосложения в первом раунде, провал — урон ×2',
      mode: 'add',
      value: 'constitution',
      condition: 'combat.round === 1',
    };

    const preset = EFFECT_MODIFIER_MENU.flatMap((menuGroup) => menuGroup.items)
      .filter(
        (menuItem): menuItem is EffectModifierPreset =>
          !isEffectModifierSubmenu(menuItem),
      )
      .find((candidate) => candidate.label === expected.label);

    expect(preset).toEqual(expected);
  });
});

describe('смертельный удар: исход спасброска «провал — урон удвоен»', () => {
  it('есть в списках заклинания, оружия и действия существа', () => {
    expect(SPELL_SAVE_EFFECT_OPTIONS).toContainEqual({
      label: SYSTEM_DOUBLE_LABEL,
      value: 'DOUBLE',
    });

    expect(WEAPON_SAVE_EFFECT_OPTIONS).toContainEqual({
      label: SYSTEM_DOUBLE_LABEL,
      value: 'double',
    });

    expect(CREATURE_SAVE_EFFECT_OPTIONS).toContainEqual({
      label: SYSTEM_DOUBLE_LABEL,
      value: 'DOUBLE',
    });
  });

  it('загруженное действие существа сохраняет исход', () => {
    expect(
      parseLoadedCreatureActionEffect({ saveEffect: 'DOUBLE' }).saveEffect,
    ).toBe('DOUBLE');
  });
});
