import type { EffectChange } from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  describeActiveEffect,
  describeEffectChange,
  describeEffectChangeValueHint,
  describeEffectChangeValueLabel,
  renderReadableFormula,
  validateFormula,
} from '~active-effects/model';

import { createEffect } from './fixtures';

/**
 * Расшифровка значения модификатора под полем формы — зеркало
 * `tests/effectValueHint.test.mjs` системы. Формулу читают словами тем же
 * разбором, что её проверяет, — иначе подпись разошлась бы с итогом.
 */

/**
 * Строка модификатора «Добавить» с заданным значением.
 *
 * @param value значение.
 * @param key ключ строки.
 * @returns строка модификатора.
 */
function addChange(value: string, key = 'damage.melee'): EffectChange {
  return { key, mode: 'add', value, condition: '', priority: 20 };
}

describe('describeEffectChangeValueHint', () => {
  it('число и кость не расшифровываются — они понятны и так', () => {
    expect(describeEffectChangeValueHint(addChange('2'))).toBe('');
    expect(describeEffectChangeValueHint(addChange('1к4'))).toBe('');
  });

  it('floor читается словами, переменные — подписями', () => {
    expect(
      describeEffectChangeValueHint(
        addChange('2 + floor((@classLevel - 1) / 4)'),
      ),
    ).toBe('+2 + ((уровень в классе − 1) / 4, с округлением вниз)');
  });

  it('скобки остаются там, где они меняют смысл', () => {
    expect(
      describeEffectChangeValueHint(addChange('@prof * (2 - @level)')),
    ).toBe('+бонус мастерства × (2 − уровень)');
  });

  it('формула урона с токенами описывается частью урона', () => {
    const hint = describeEffectChangeValueHint(
      addChange('2к6@dmg.fire@target.full'),
    );

    expect(hint).not.toContain('@');
    expect(hint).toContain('2к6');
  });

  it('подпись под полем начинается с «Значение:», у числа её нет', () => {
    expect(describeEffectChangeValueLabel(addChange('@prof'))).toBe(
      'Значение: +бонус мастерства',
    );

    expect(describeEffectChangeValueLabel(addChange('3'))).toBeUndefined();
  });

  it('сводка модификатора читает формулу тем же способом', () => {
    expect(
      describeEffectChange(addChange('max(1, @mod.cha)', 'armorClass')),
    ).toContain('большее из (1; мод. Харизмы)');
  });
});

describe('steps() — число порогов, пройденных значением', () => {
  it('формула со ступенями годна', () => {
    expect(validateFormula('1 + steps(@classLevel, 7, 13, 18)').valid).toBe(
      true,
    );
  });

  it('ступени читаются словами', () => {
    expect(
      renderReadableFormula(
        '1 + steps(@classLevel, 7, 13, 18)',
        (token) => token,
      ),
    ).toBe('1 + (число порогов 7, 13, 18, пройденных по @classLevel)');
  });

  it('неразборная формула не расшифровывается', () => {
    expect(renderReadableFormula('2к6 + @prof', (token) => token)).toBe(
      undefined,
    );
  });

  it('число костей выражением (0.8.86): скобки со ступенями перед костью', () => {
    expect(validateFormula('1 + steps(@classLevel, 7, 13, 18)').valid).toBe(
      true,
    );

    const spark = createEffect({
      effectTarget: 'target',
      damageParts: [
        {
          formula:
            '(1 + steps(@classLevel, 7, 13, 18))к8@dmg.radiant + @mod.wis',
          target: 'selected',
        },
      ],
    });

    expect(describeActiveEffect(spark)).toContain(
      '(1 + steps(уровень в классе, 7, 13, 18))к8 + мод. Мудрости излучением',
    );
  });

  it('незнакомая функция по-прежнему ошибка', () => {
    expect(validateFormula('stairs(@level, 5)').valid).toBe(false);
  });
});
