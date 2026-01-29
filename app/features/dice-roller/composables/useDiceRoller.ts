import { DiceRoller } from 'dice-roller-parser';
import { trim } from 'es-toolkit';
import { DICE_RUSSIAN_OPERATORS } from '~dice-roller/const';

/**
 * Регулярное выражение для замены русских операторов.
 * Более длинные паттерны идут первыми для корректной работы.
 */
const RUSSIAN_OPERATORS_PATTERN = new RegExp(
  Object.keys(DICE_RUSSIAN_OPERATORS)
    .sort((a, b) => b.length - a.length)
    .map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'gi',
);

/**
 * Нормализует русскую нотацию костей в стандартную Roll20.
 *
 * @param notation - Нотация на русском языке (например, "2к6+3")
 * @returns Нормализованная нотация (например, "2d6+3")
 */
function normalizeRussianNotation(notation: string): string {
  const normalized = trim(notation);

  return normalized
    .replace(
      RUSSIAN_OPERATORS_PATTERN,
      (match) => DICE_RUSSIAN_OPERATORS[match.toLowerCase()] || match,
    )
    .replace(/\s+/g, '');
}

/**
 * Проверяет, является ли строка валидной нотацией костей.
 *
 * @param notation - Значение для проверки
 * @returns true, если нотация валидна
 */
function isValidNotation(notation: unknown): notation is string {
  if (!notation || typeof notation !== 'string') {
    return false;
  }

  try {
    const roller = new DiceRoller();
    const normalized = normalizeRussianNotation(notation);

    roller.parse(normalized);

    return true;
  } catch {
    return false;
  }
}

/**
 * Композиция для работы с бросками кубов.
 * Предоставляет методы для выполнения бросков, валидации и статистики.
 *
 * @example
 * const { roll, validate } = useDiceRoller();
 *
 * if (validate('2к6+3')) {
 *   const result = roll('2к6+3');
 *   console.log(result.value);
 * }
 */
export function useDiceRoller() {
  const roller = new DiceRoller();

  /**
   * Выполняет бросок и возвращает числовой результат.
   *
   * @param notation - Нотация броска (например, "2к6+3")
   * @returns Числовой результат броска
   */
  const rollValue = (notation: string): number => {
    const normalized = normalizeRussianNotation(notation);

    return roller.rollValue(normalized);
  };

  /**
   * Выполняет бросок и возвращает полный объект результата.
   *
   * @param notation - Нотация броска (например, "2к6+3")
   * @returns Объект с детальной информацией о броске
   */
  const roll = (notation: string) => {
    const normalized = normalizeRussianNotation(notation);

    return roller.roll(normalized);
  };

  /**
   * Парсит нотацию без выполнения броска.
   *
   * @param notation - Нотация для парсинга
   * @returns Распарсенное дерево нотации
   */
  const parseNotation = (notation: string) => {
    const normalized = normalizeRussianNotation(notation);

    return roller.parse(normalized);
  };

  /**
   * Нормализует русскую нотацию в английскую.
   *
   * @param notation - Нотация на русском языке
   * @returns Нотация на английском языке
   */
  const normalize = (notation: string): string => {
    return normalizeRussianNotation(notation);
  };

  /**
   * Проверяет валидность нотации.
   *
   * @param notation - Значение для проверки
   * @returns true, если нотация валидна
   */
  const validate = (notation: unknown): boolean => {
    return isValidNotation(notation);
  };

  /**
   * Проверяет валидность и возвращает ошибку, если есть.
   *
   * @param notation - Значение для проверки
   * @returns Объект с флагом валидности и опциональной ошибкой
   */
  const validateWithError = (
    notation: unknown,
  ): { valid: boolean; error?: string } => {
    if (!notation || typeof notation !== 'string') {
      return { valid: false, error: 'Пустая или некорректная нотация' };
    }

    try {
      const normalized = normalizeRussianNotation(notation);

      roller.parse(normalized);

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Неизвестная ошибка парсинга',
      };
    }
  };

  /**
   * Выполняет множественные броски.
   *
   * @param notation - Нотация броска
   * @param count - Количество бросков
   * @returns Массив результатов
   */
  const rollMultiple = (notation: string, count: number) => {
    const results = [];

    for (let i = 0; i < count; i++) {
      results.push(rollValue(notation));
    }

    return results;
  };

  /**
   * Возвращает статистику по множественным броскам.
   *
   * @param notation - Нотация броска
   * @param count - Количество бросков
   * @returns Объект со статистикой (results, sum, avg, min, max)
   */
  const rollStats = (notation: string, count: number) => {
    const results = rollMultiple(notation, count);
    const sum = results.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;
    const min = Math.min(...results);
    const max = Math.max(...results);

    return {
      results,
      count,
      sum,
      avg,
      min,
      max,
    };
  };

  return {
    roll,
    rollValue,
    rollMultiple,
    rollStats,
    normalize,
    validate,
    validateWithError,
    parseNotation,
  };
}
