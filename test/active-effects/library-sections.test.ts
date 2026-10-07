import type { EffectModifierPreset } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  describeEffectChangeValueError,
  EFFECT_CONDITION_AND_SEPARATOR,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_SECTIONS,
  EFFECT_FLAG_LABELS,
  EFFECT_FLAG_LIBRARY,
  EFFECT_MODIFIER_MENU,
  EFFECT_STRENGTH_ATTACK_CONDITION,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_TARGET_LIBRARY,
  EFFECT_VALUE_SECTIONS,
  EFFECT_VALUE_SUGGESTIONS,
  isDiceFormulaValue,
  isEffectModifierSubmenu,
  RAGE_DAMAGE_BONUS_FORMULA,
  renderReadableFormula,
  splitConditionParts,
  validateFormula,
} from '~active-effects/model';
import { buildLibraryMenuGroups } from '~ui/input';

/**
 * Библиотеки подсказок редактора эффектов по разделам — зеркало
 * `tests/effectLibrarySections.test.mjs` системы. Сайт и система обязаны
 * предлагать одно и то же: строка, которую форма подсветит ошибкой или которую
 * VTTG не поймёт, хуже отсутствия строки.
 */

/** Подпись раздела меню «Готовые» с условиями броска, атаки и цели. */
const ROLL_CONDITION_GROUP_LABEL = 'Условие: бросок, атака, цель';

/** Подписи новых готовых пунктов меню модификаторов. */
const PRESET_LABELS = {
  rageMelee: 'Урон Ярости: +2 → +4 по уровню класса, удары Силой',
  defense: 'КД: +1 в доспехе (Оборона)',
  classLevelHitPoints: 'Максимум хитов: за каждый уровень класса',
  fireItemDamage: 'Урон предмета: +1к6 огнём',
  undeadDamage: 'Урон: +2к6 только по нежити',
};

/** Ключ, у которого кость в значении бросается: урон. */
const DICE_ROLLING_KEY = 'damage.all';

/** Особое правило с короткой подписью в меню и полной в библиотеке. */
const FIRE_RESISTANCE_FLAG = 'resistance.fire';

/** Раздел библиотеки особых правил, где лежит сопротивление урону. */
const RESISTANCE_SECTION_LABEL = 'Сопротивление';

/** Составное условие библиотеки и число его частей. */
const COMPOSITE_CONDITION_LABEL = 'Носитель: без доспеха и без щита';
const COMPOSITE_CONDITION_PART_COUNT = 2;

/** Функции формулы, которые библиотека значений обязана показать примером. */
const SHOWN_FORMULA_FUNCTIONS = ['steps(', 'floor(', 'ceil(', 'max(', 'min('];

/** Значение, которое находится только по пояснению «шансы равные». */
const RANDOM_DAMAGE_TYPE_VALUE = '1к6@dmg.random(fire,cold)';

/** Строки библиотеки без разделов — как у полей вне редактора эффектов. */
const FLAT_LIBRARY_OPTIONS = [
  { label: 'Первая', value: 'first' },
  { label: 'Вторая', value: 'second' },
];

/**
 * Готовые строки меню модификаторов без подменю.
 *
 * @returns готовые строки всех разделов.
 */
function listReadyPresets(): EffectModifierPreset[] {
  return EFFECT_MODIFIER_MENU.flatMap((menuGroup) => menuGroup.items).filter(
    (menuItem): menuItem is EffectModifierPreset =>
      !isEffectModifierSubmenu(menuItem),
  );
}

/**
 * Готовая строка меню модификаторов по подписи.
 *
 * @param presetLabel подпись пункта меню.
 * @returns готовая строка либо `undefined`.
 */
function findReadyPreset(
  presetLabel: string,
): EffectModifierPreset | undefined {
  return listReadyPresets().find((preset) => preset.label === presetLabel);
}

/**
 * Значения строк библиотеки значений, найденных поиском.
 *
 * @param searchQuery поисковая строка.
 * @returns значения найденных строк по порядку.
 */
function findSuggestedValues(searchQuery: string): Array<string | undefined> {
  return buildLibraryMenuGroups(EFFECT_VALUE_SUGGESTIONS, searchQuery)
    .flat()
    .filter((menuItem) => menuItem.type === 'item')
    .map((menuItem) => menuItem.value);
}

describe('библиотека значений', () => {
  it('каждый пример проходит проверку поля: кость или читаемая формула', () => {
    for (const suggestion of EFFECT_VALUE_SUGGESTIONS) {
      const isValid =
        isDiceFormulaValue(suggestion.value)
        || validateFormula(suggestion.value).valid;

      expect(isValid, `${suggestion.label}: ${suggestion.value}`).toBe(true);

      expect(
        describeEffectChangeValueError({
          key: DICE_ROLLING_KEY,
          mode: 'add',
          value: suggestion.value,
        }),
        suggestion.value,
      ).toBeUndefined();
    }
  });

  it('разложена по разделам, и каждый раздел не пуст', () => {
    const sectionLabels = new Set(
      EFFECT_VALUE_SUGGESTIONS.map((suggestion) => suggestion.section),
    );

    expect([...sectionLabels]).toEqual(Object.values(EFFECT_VALUE_SECTIONS));
  });

  it('показывает функции формулы: ступени, округление, минимум', () => {
    const suggestedValues = EFFECT_VALUE_SUGGESTIONS.map(
      (suggestion) => suggestion.value,
    );

    for (const functionCall of SHOWN_FORMULA_FUNCTIONS) {
      expect(
        suggestedValues.some((suggestedValue) =>
          suggestedValue.includes(functionCall),
        ),
        functionCall,
      ).toBe(true);
    }
  });
});

describe('библиотеки условий, ключей и правил', () => {
  it('у каждой строки есть раздел', () => {
    for (const library of [
      EFFECT_VALUE_SUGGESTIONS,
      EFFECT_CONDITION_EXPR_SUGGESTIONS,
      EFFECT_TARGET_LIBRARY,
      EFFECT_FLAG_LIBRARY,
    ]) {
      expect(library.length).toBeGreaterThan(0);
      expect(library.every((suggestion) => suggestion.section)).toBe(true);
    }
  });

  it('условия идут разделами в порядке показа', () => {
    const sectionLabels = new Set(
      EFFECT_CONDITION_EXPR_SUGGESTIONS.map((suggestion) => suggestion.section),
    );

    expect([...sectionLabels]).toEqual(
      Object.values(EFFECT_CONDITION_SECTIONS),
    );
  });

  it('ключей и правил столько же, сколько знает редактор', () => {
    expect(EFFECT_TARGET_LIBRARY).toHaveLength(
      EFFECT_TARGET_KEY_SUGGESTIONS.length,
    );

    expect(EFFECT_FLAG_LIBRARY).toHaveLength(
      Object.keys(EFFECT_FLAG_LABELS).length,
    );
  });

  it('у правила в библиотеке полная подпись, а не короткая из меню', () => {
    const fireResistance = EFFECT_FLAG_LIBRARY.find(
      (suggestion) => suggestion.value === FIRE_RESISTANCE_FLAG,
    );

    expect(fireResistance?.label).toBe(
      EFFECT_FLAG_LABELS[FIRE_RESISTANCE_FLAG],
    );

    expect(fireResistance?.section).toBe(RESISTANCE_SECTION_LABEL);
  });

  it('составное условие без доспеха и щита читается подписью', () => {
    const compositeCondition = EFFECT_CONDITION_EXPR_SUGGESTIONS.find(
      (suggestion) => suggestion.value.includes(EFFECT_CONDITION_AND_SEPARATOR),
    );

    expect(compositeCondition?.label).toBe(COMPOSITE_CONDITION_LABEL);

    expect(splitConditionParts(compositeCondition?.value ?? '')).toHaveLength(
      COMPOSITE_CONDITION_PART_COUNT,
    );
  });
});

describe('меню «Готовые»', () => {
  it('урон Ярости — одна формула ступеней на оба пункта и на библиотеку', () => {
    const ragePresets = listReadyPresets().filter(
      (preset) => preset.value === RAGE_DAMAGE_BONUS_FORMULA,
    );

    expect(ragePresets.map((preset) => preset.key)).toEqual([
      'damage.melee',
      'damage.ranged',
    ]);

    expect(ragePresets[0]?.label).toBe(PRESET_LABELS.rageMelee);

    expect(
      ragePresets.every(
        (preset) => preset.condition === EFFECT_STRENGTH_ATTACK_CONDITION,
      ),
    ).toBe(true);

    expect(
      EFFECT_VALUE_SUGGESTIONS.some(
        (suggestion) => suggestion.value === RAGE_DAMAGE_BONUS_FORMULA,
      ),
    ).toBe(true);
  });

  it('формула Ярости разбирается и читается порогами 9 и 16', () => {
    // Сайт формулу не вычисляет — +2/+3/+4 на 1/9/16 уровнях проверяет тест
    // системы
    expect(validateFormula(RAGE_DAMAGE_BONUS_FORMULA).valid).toBe(true);

    const readableFormula = renderReadableFormula(
      RAGE_DAMAGE_BONUS_FORMULA,
      (token) => token,
    );

    expect(readableFormula).toContain('9, 16');
    expect(readableFormula).toContain('@classLevel');
  });

  it('новые готовые пункты заводят строку с ключом, значением и условием', () => {
    expect(findReadyPreset(PRESET_LABELS.defense)).toEqual({
      key: 'armorClass',
      label: PRESET_LABELS.defense,
      mode: 'add',
      value: '1',
      condition: 'self.armor === "any"',
    });

    expect(findReadyPreset(PRESET_LABELS.classLevelHitPoints)?.value).toBe(
      '@classLevel',
    );

    expect(findReadyPreset(PRESET_LABELS.fireItemDamage)?.value).toBe(
      '1к6@dmg.fire',
    );

    expect(findReadyPreset(PRESET_LABELS.undeadDamage)?.value).toBe(
      '2к6@target.type.undead',
    );
  });

  it('раздел условий броска ставит только условие', () => {
    const rollConditionGroup = EFFECT_MODIFIER_MENU.find(
      (menuGroup) => menuGroup.label === ROLL_CONDITION_GROUP_LABEL,
    );

    expect(rollConditionGroup?.items.length).toBeGreaterThan(0);

    for (const menuItem of rollConditionGroup?.items ?? []) {
      expect(isEffectModifierSubmenu(menuItem)).toBe(false);
      expect(menuItem.key).toBe('');
      expect('value' in menuItem ? menuItem.value : undefined).toBeUndefined();

      expect(
        'condition' in menuItem ? menuItem.condition : undefined,
      ).toBeTruthy();
    }
  });
});

describe('выпадающий список библиотеки', () => {
  it('без поиска — все разделы с заголовками', () => {
    const menuGroups = buildLibraryMenuGroups(EFFECT_VALUE_SUGGESTIONS);

    expect(menuGroups.map((menuGroup) => menuGroup[0]?.label)).toEqual(
      Object.values(EFFECT_VALUE_SECTIONS),
    );

    expect(
      menuGroups.every((menuGroup) => menuGroup[0]?.type === 'label'),
    ).toBe(true);
  });

  it('поиск идёт по названию, значению и пояснению', () => {
    expect(findSuggestedValues('урон ярости')).toEqual([
      RAGE_DAMAGE_BONUS_FORMULA,
    ]);

    expect(findSuggestedValues('STEPS(')).toEqual([RAGE_DAMAGE_BONUS_FORMULA]);

    expect(findSuggestedValues('шансы равные')).toEqual([
      RANDOM_DAMAGE_TYPE_VALUE,
    ]);

    expect(findSuggestedValues('такого нет')).toEqual([]);
  });

  it('один раздел на экране — без заголовка', () => {
    const menuGroups = buildLibraryMenuGroups(
      EFFECT_VALUE_SUGGESTIONS,
      '@heal',
    );

    expect(menuGroups).toHaveLength(1);

    expect(menuGroups[0]?.every((menuItem) => menuItem.type === 'item')).toBe(
      true,
    );
  });

  it('одинаковое пояснение соседних строк показывается один раз', () => {
    const carrierTypeRows = buildLibraryMenuGroups(
      EFFECT_CONDITION_EXPR_SUGGESTIONS,
      'self.creatureType',
    ).flat();

    expect(carrierTypeRows.length).toBeGreaterThan(1);
    expect(carrierTypeRows[0]?.description).toBeTruthy();

    expect(
      carrierTypeRows.slice(1).every((menuItem) => !menuItem.description),
    ).toBe(true);
  });

  it('список без разделов остаётся плоским, без заголовков', () => {
    expect(buildLibraryMenuGroups(FLAT_LIBRARY_OPTIONS)).toEqual([
      FLAT_LIBRARY_OPTIONS.map((flatOption) => ({
        type: 'item',
        label: flatOption.label,
        value: flatOption.value,
        description: undefined,
      })),
    ]);
  });
});
