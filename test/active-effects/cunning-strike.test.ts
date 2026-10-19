import type {
  EffectLibrarySuggestion,
  EffectModifierPreset,
} from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  ACTIVE_EFFECT_LABELS,
  describeEffectChangeConditionWarning,
  describeEffectChangeValueError,
  describeEffectChangeValueNote,
  describeTriggerCondition,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_SECTIONS,
  EFFECT_MODIFIER_MENU,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_TRIGGER_CONDITION_KIND_LABELS,
  isEffectModifierSubmenu,
  isSneakAttackKey,
  listTriggerConditionKinds,
  parseTriggerConditionPart,
  writeTriggerCondition,
} from '~active-effects/model';
import {
  getEffectBonusTarget,
  matchesArmorCondition,
  resolveSheetEffects,
  toInventoryBonusesFromEffects,
} from '~character-sheet/model';

import { createAddChange, createEffect } from './fixtures';

/**
 * Скрытая атака, этап 3 — Хитрый удар: ключи приёмов, условия «первый раунд»,
 * «цель ещё не ходила», «с набором отравителя», часть срабатывания «урон
 * нанесён Скрытой атакой». Строки — ровно как в системе dnd5e-2024. Лист сайта
 * их не считает, но и не ломается на них.
 */

/** Новые ключи строки и их подписи в системе. */
const SYSTEM_KEY_LABELS: Record<string, string> = {
  'sneakAttack.cunningStrike':
    'Хитрый удар: приём (цена в костях Скрытой атаки)',
  'sneakAttack.cunningStrikeCount':
    'Хитрый удар: прибавка к числу приёмов за удар',
  'sneakAttack.rider':
    'Скрытая атака: эффект по выбору при её уроне (цена в костях)',
  'sneakAttack.minDie': 'Скрытая атака: наименьшее значение кости',
};

/** Условие системы «у носителя набор отравителя». */
const SYSTEM_POISONERS_KIT_CONDITION = 'self.tool === "poisoners-kit"';

/**
 * Подсказка условия по значению.
 *
 * @param value строка условия.
 * @returns подсказка либо `undefined`.
 */
function findCondition(value: string): EffectLibrarySuggestion | undefined {
  return EFFECT_CONDITION_EXPR_SUGGESTIONS.find(
    (suggestion) => suggestion.value === value,
  );
}

describe('хитрый удар: словарь', () => {
  it('ключи строки с подписями системы — не числа листа', () => {
    const labels = new Map(
      EFFECT_TARGET_KEY_SUGGESTIONS.map((suggestion) => [
        suggestion.value,
        suggestion.label,
      ]),
    );

    for (const [key, label] of Object.entries(SYSTEM_KEY_LABELS)) {
      expect(labels.get(key)).toBe(label);
      expect(isSneakAttackKey(key)).toBe(true);
    }
  });

  it('значения — числа: у каждого ключа своё пояснение, кость — ошибка', () => {
    expect(
      describeEffectChangeValueNote(
        createAddChange('sneakAttack.cunningStrike', '1'),
      ),
    ).toBe(ACTIVE_EFFECT_LABELS.changeCunningStrikeHint);

    expect(
      describeEffectChangeValueNote(
        createAddChange('sneakAttack.cunningStrikeCount', '1'),
      ),
    ).toBe(ACTIVE_EFFECT_LABELS.changeCunningStrikeCountHint);

    expect(
      describeEffectChangeValueNote(createAddChange('sneakAttack.rider', '0')),
    ).toBe(ACTIVE_EFFECT_LABELS.changeSneakAttackRiderHint);

    expect(
      describeEffectChangeValueNote(createAddChange('sneakAttack.minDie', '3')),
    ).toBe(ACTIVE_EFFECT_LABELS.changeSneakAttackMinDieHint);

    expect(
      describeEffectChangeValueError(
        createAddChange('sneakAttack.cunningStrike', '1'),
      ),
    ).toBeUndefined();

    expect(
      describeEffectChangeValueError(
        createAddChange('sneakAttack.minDie', '1к6'),
      ),
    ).toBe(ACTIVE_EFFECT_LABELS.changeDiceNotRolledError);

    // «Или» у ключей Скрытой атаки считает окно атаки — предупреждать не о чем
    expect(
      describeEffectChangeConditionWarning({
        key: 'sneakAttack.cunningStrike',
        condition: 'roll.hasAdvantage === true || target.allyAdjacent',
      }),
    ).toBeUndefined();
  });

  it('условия: раздел, подпись и пояснение системы', () => {
    expect(findCondition('combat.round === 1')).toEqual({
      value: 'combat.round === 1',
      label: 'Бой: первый раунд',
      hint: 'Вне боя не выполняется.',
      section: EFFECT_CONDITION_SECTIONS.roll,
    });

    expect(findCondition('target.hasActed === false')).toEqual({
      value: 'target.hasActed === false',
      label: 'Цель: ещё не ходила в этом бою',
      hint: 'По порядку инициативы: в первом раунде её ход ещё впереди. Вне боя не выполняется.',
      section: EFFECT_CONDITION_SECTIONS.roll,
    });

    expect(findCondition(SYSTEM_POISONERS_KIT_CONDITION)).toEqual({
      value: SYSTEM_POISONERS_KIT_CONDITION,
      label: 'Носитель: с набором отравителя',
      hint: 'Инструмент этого вида есть в снаряжении — «Отравить» Хитрого удара.',
      section: EFFECT_CONDITION_SECTIONS.armor,
    });
  });

  it('готовые пункты меню — как в системе', () => {
    const presets = EFFECT_MODIFIER_MENU.flatMap(
      (menuGroup) => menuGroup.items,
    ).filter(
      (menuItem): menuItem is EffectModifierPreset =>
        !isEffectModifierSubmenu(menuItem),
    );

    const expected: EffectModifierPreset[] = [
      {
        key: 'sneakAttack.cunningStrike',
        label: 'Хитрый удар: приём ценой 1к6',
        mode: 'add',
        value: '1',
      },
      {
        key: 'sneakAttack.cunningStrike',
        label: 'Хитрый удар: «Отравить» — с набором отравителя',
        mode: 'add',
        value: '1',
        condition: SYSTEM_POISONERS_KIT_CONDITION,
      },
      {
        key: 'sneakAttack.cunningStrikeCount',
        label: 'Улучшенный хитрый удар: +1 приём за удар',
        mode: 'add',
        value: '1',
      },
      {
        key: 'sneakAttack.rider',
        label: 'Скрытая атака: эффект по выбору при её уроне',
        mode: 'add',
        value: '0',
      },
      {
        key: 'sneakAttack.minDie',
        label: 'Скрытая атака: 1 и 2 на костях считаются за 3',
        mode: 'add',
        value: '3',
      },
    ];

    for (const preset of expected) {
      expect(
        presets.find((candidate) => candidate.label === preset.label),
      ).toEqual(preset);
    }
  });
});

describe('хитрый удар: срабатывание «урон нанесён Скрытой атакой»', () => {
  it('часть условия — строка системы, только на броске атаки', () => {
    expect(writeTriggerCondition([{ kind: 'attackSneakAttack' }])).toBe(
      'attack.sneakAttack === true',
    );

    expect(parseTriggerConditionPart('attack.sneakAttack === true')).toEqual({
      kind: 'attackSneakAttack',
    });

    expect(listTriggerConditionKinds('attackRoll')).toContain(
      'attackSneakAttack',
    );

    expect(listTriggerConditionKinds('applied')).not.toContain(
      'attackSneakAttack',
    );

    expect(EFFECT_TRIGGER_CONDITION_KIND_LABELS.attackSneakAttack).toBe(
      'Атака нанесла урон Скрытой атакой',
    );

    expect(describeTriggerCondition('attack.sneakAttack === true')).toContain(
      'урон нанесён Скрытой атакой',
    );
  });
});

describe('лист сайта и Хитрый удар', () => {
  it('новые ключи и условие инструмента лист пропускает, не падая', () => {
    const effect = createEffect({
      changes: [
        createAddChange('sneakAttack.cunningStrike', '1'),
        createAddChange(
          'sneakAttack.cunningStrike',
          '1',
          SYSTEM_POISONERS_KIT_CONDITION,
        ),
        createAddChange('sneakAttack.cunningStrikeCount', '1'),
        createAddChange('sneakAttack.rider', '0'),
        createAddChange('sneakAttack.minDie', '3'),
        // Ключ листа с условием инструмента: лист его не считает
        createAddChange('armorClass', '1', SYSTEM_POISONERS_KIT_CONDITION),
      ],
    });

    for (const key of Object.keys(SYSTEM_KEY_LABELS)) {
      expect(getEffectBonusTarget(key)).toBeNull();
    }

    expect(toInventoryBonusesFromEffects([effect])).toEqual([]);
    expect(() => resolveSheetEffects([effect])).not.toThrow();

    expect(
      matchesArmorCondition(SYSTEM_POISONERS_KIT_CONDITION, {
        hasShield: false,
      }),
    ).toBe(false);
  });
});
