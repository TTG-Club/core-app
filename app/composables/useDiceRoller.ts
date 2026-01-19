import { DiceRoller } from 'dice-roller-parser';
import { trim } from 'es-toolkit';

/**
 * Маппинг русских операторов на Roll20 нотацию
 * Группировка по функциональности
 */
const RUSSIAN_OPERATORS: Record<string, string> = {
  // === Базовые операторы ===
  'к': 'd', // кость (die)
  'кс': 'dF', // кость судьбы (fate die)

  // === Keep (взять) ===
  'вл': 'kh', // взять лучшие (keep highest)
  'вх': 'kl', // взять худшие (keep lowest)

  // === Drop (убрать) ===
  'ул': 'dh', // убрать лучшие (drop highest)
  'ух': 'dl', // убрать худшие (drop lowest)

  // === Reroll (перебросить) ===
  'пр': 'ro', // переброс один раз (reroll once)
  'пб': 'r', // переброс (reroll)

  // === Exploding (взрывающиеся) ===
  '!п': '!p', // проникающий (penetrate)

  // === Модификаторы ===
  'с': 'm', // совпадение (match)
  'п': 'f', // провал (failure)

  // === Сортировка ===
  'св': 'sa', // сортировка возрастание (sort ascending)
  'су': 'sd', // сортировка убывание (sort descending)
};

/**
 * Создаёт регулярку со всеми паттернами
 * Более длинные паттерны идут первыми для корректной работы
 */
const PATTERN = new RegExp(
  Object.keys(RUSSIAN_OPERATORS)
    .sort((a, b) => b.length - a.length)
    .map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'gi',
);

/**
 * Нормализует русскую нотацию костей в стандартную Roll20
 */
function normalizeRussianDiceNotation(notation: string): string {
  const normalized = trim(notation);

  return normalized
    .replace(
      PATTERN,
      (match) => RUSSIAN_OPERATORS[match.toLowerCase()] || match,
    )
    .replace(/\s+/g, '');
}

/**
 * Проверяет, является ли строка валидной нотацией костей
 */
function isValidNotation(notation: unknown): notation is string {
  if (!notation || typeof notation !== 'string') {
    return false;
  }

  try {
    const roller = new DiceRoller();
    const normalized = normalizeRussianDiceNotation(notation);

    roller.parse(normalized);

    return true;
  } catch {
    return false;
  }
}

export function useDiceRoller() {
  const roller = new DiceRoller();

  /**
   * Выполняет бросок и возвращает числовой результат
   */
  const rollValue = (notation: string): number => {
    const normalized = normalizeRussianDiceNotation(notation);

    return roller.rollValue(normalized);
  };

  /**
   * Выполняет бросок и возвращает полный объект результата
   */
  const roll = (notation: string) => {
    const normalized = normalizeRussianDiceNotation(notation);

    return roller.roll(normalized);
  };

  /**
   * Парсит нотацию без выполнения броска
   */
  const parseNotation = (notation: string) => {
    const normalized = normalizeRussianDiceNotation(notation);

    return roller.parse(normalized);
  };

  /**
   * Нормализует русскую нотацию в английскую
   */
  const normalize = (notation: string): string => {
    return normalizeRussianDiceNotation(notation);
  };

  /**
   * Проверяет валидность нотации
   */
  const validate = (notation: unknown): boolean => {
    return isValidNotation(notation);
  };

  /**
   * Проверяет валидность и возвращает ошибку, если есть
   */
  const validateWithError = (
    notation: unknown,
  ): { valid: boolean; error?: string } => {
    if (!notation || typeof notation !== 'string') {
      return { valid: false, error: 'Пустая или некорректная нотация' };
    }

    try {
      const normalized = normalizeRussianDiceNotation(notation);

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
   * Выполняет множественные броски
   */
  const rollMultiple = (notation: string, count: number) => {
    const results = [];

    for (let i = 0; i < count; i++) {
      results.push(rollValue(notation));
    }

    return results;
  };

  /**
   * Возвращает статистику по множественным броскам
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

  /**
   * Возвращает словарь доступных русских операторов
   */
  const getRusOperators = () => {
    return { ...RUSSIAN_OPERATORS };
  };

  return {
    // Основные методы
    rollValue,
    roll,
    parseNotation,

    // Утилиты
    normalize,
    validate,
    validateWithError,

    // Статистика
    rollMultiple,
    rollStats,

    // Справочная информация
    getRusOperators,
  };
}
