import type { FormulaOperator } from './types';

/**
 * Применяет арифметическую операцию формулы.
 *
 * Деление округляется вниз: в правилах D&D дробный результат всегда
 * округляется вниз — так же считается половина урона при `save half`.
 * Деление на ноль даёт ноль, иначе бесконечность утекла бы и в результат
 * броска, и в гистограмму распределения.
 *
 * @param operator - Знак операции
 * @param left - Левый операнд
 * @param right - Правый операнд
 * @returns Целочисленный результат операции
 *
 * @example
 * applyOperator('/', 15, 2); // 7
 */
export function applyOperator(
  operator: FormulaOperator,
  left: number,
  right: number,
): number {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
    default:
      return right === 0 ? 0 : Math.floor(left / right);
  }
}
