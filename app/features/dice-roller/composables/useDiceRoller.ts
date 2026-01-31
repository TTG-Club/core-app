import { DiceRoller } from '@ttg-club/dice-roller-parser';

const roller = new DiceRoller();

/**
 * Композиция для работы с бросками кубов.
 * Предоставляет методы для выполнения бросков, валидации и статистики.
 *
 * @example
 * const { roll, validateWithError } = useDiceRoller();
 *
 * const { valid } = validateWithError('2к6+3');
 * if (valid) {
 *   const result = roll('2к6+3');
 *   console.log(result.value);
 * }
 */
export function useDiceRoller() {
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
      roller.parse(notation);

      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      const userMessage = message.startsWith('Expected')
        ? 'Некорректная формула'
        : message || 'Неизвестная ошибка парсинга';

      return {
        valid: false,
        error: userMessage,
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
      results.push(roller.rollValue(notation));
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
    roll: roller.roll.bind(roller),
    rollValue: roller.rollValue.bind(roller),
    parseNotation: roller.parse.bind(roller),
    rollMultiple,
    rollStats,
    validateWithError,
  };
}
