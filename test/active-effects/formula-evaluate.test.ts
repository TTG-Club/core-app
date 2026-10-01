import { describe, expect, it } from 'vitest';

import { evaluateFormula } from '~active-effects/model';

import {
  AURA_OF_PROTECTION_FORMULA,
  MIN_AURA_OF_PROTECTION_BONUS,
} from './fixtures';

/** Модификатор Харизмы в тестах. */
const CHARISMA_MODIFIER = 3;

/** Отрицательный модификатор Харизмы: аура всё равно даёт наименьшую прибавку. */
const NEGATIVE_CHARISMA_MODIFIER = -1;

/** Уровень в классе в тестах. */
const CLASS_LEVEL = 7;

/** Значения переменных листа в тестах. */
const VARIABLE_VALUES: Record<string, number> = {
  '@mod.cha': CHARISMA_MODIFIER,
  '@classLevel': CLASS_LEVEL,
};

/**
 * Значение переменной из тестового набора.
 *
 * @param variableToken токен переменной.
 * @returns число либо `undefined`, если переменной в наборе нет.
 */
function resolveTestVariable(variableToken: string): number | undefined {
  return VARIABLE_VALUES[variableToken];
}

/**
 * Значение формулы на тестовом наборе переменных.
 *
 * @param formula строка формулы.
 * @returns число либо `undefined`, если формулу не посчитать.
 */
function evaluateTestFormula(formula: string): number | undefined {
  return evaluateFormula(formula, resolveTestVariable);
}

describe('evaluateFormula', () => {
  it('считает «Ауру защиты» модификатором Харизмы', () => {
    expect(evaluateTestFormula(AURA_OF_PROTECTION_FORMULA)).toBe(
      CHARISMA_MODIFIER,
    );
  });

  it('считает «Ауру защиты» не меньше наименьшей прибавки', () => {
    expect(
      evaluateFormula(
        AURA_OF_PROTECTION_FORMULA,
        () => NEGATIVE_CHARISMA_MODIFIER,
      ),
    ).toBe(MIN_AURA_OF_PROTECTION_BONUS);
  });

  it('соблюдает приоритет операторов и скобки', () => {
    expect(evaluateTestFormula('10 + 2 * 3')).toBe(16);
    expect(evaluateTestFormula('(10 + 2) * 3')).toBe(36);
    expect(evaluateTestFormula('-@mod.cha + 1')).toBe(1 - CHARISMA_MODIFIER);
  });

  it('считает функции округления, наименьшего и ступеней', () => {
    expect(evaluateTestFormula('floor(@classLevel / 2)')).toBe(3);
    expect(evaluateTestFormula('ceil(@classLevel / 2)')).toBe(4);
    expect(evaluateTestFormula('min(@classLevel, 5)')).toBe(5);
    expect(evaluateTestFormula('1 + steps(@classLevel, 7, 13, 18)')).toBe(2);
  });

  it('считает функции чётности', () => {
    expect(evaluateTestFormula('even(@classLevel)')).toBe(0);
    expect(evaluateTestFormula('odd(@classLevel)')).toBe(1);
  });

  it('не считает формулу с незнакомой переменной', () => {
    expect(evaluateTestFormula('1 + @mod.spell')).toBe(undefined);
    expect(evaluateTestFormula('max(1, @mod.spell)')).toBe(undefined);
  });

  it('не считает пустую строку, кость и деление на ноль', () => {
    expect(evaluateTestFormula(' ')).toBe(undefined);
    expect(evaluateTestFormula('1d4')).toBe(undefined);
    expect(evaluateTestFormula('1 / 0')).toBe(undefined);
  });

  it('не считает функцию с неверным числом аргументов', () => {
    expect(evaluateTestFormula('max(1)')).toBe(undefined);
    expect(evaluateTestFormula('floor(1, 2)')).toBe(undefined);
  });
});
