import type { DiceFormulaExample } from './types';

export const DICE_EXAMPLES_BASIC: DiceFormulaExample[] = [
  { formula: 'к20', note: 'одиночный куб' },
  { formula: '2к6+3', note: 'сумма с модификатором' },
  { formula: '(4к6вх3+2)*2', note: 'группировка' },
];

export const DICE_EXAMPLES_KEEP: DiceFormulaExample[] = [
  { formula: '4к6вх3', note: 'оставить лучшие (kh3)' },
  { formula: '3к8вл1', note: 'оставить худшие (kl1)' },
  { formula: '5к10ул2', note: 'убрать лучшие (dh2)' },
  { formula: '5к10ух2', note: 'убрать худшие (dl2)' },
];

export const DICE_EXAMPLES_REROLL: DiceFormulaExample[] = [
  { formula: 'к20пр1', note: 'переброс 1 (ro1)' },
  { formula: '10к6пб2', note: 'переброс 2 (r2)' },
  { formula: '8к6р<3', note: 'переброс <3' },
];

export const DICE_HISTORY_STORAGE_KEY = 'dice-roller:history:v1';

/**
 * Маппинг русских операторов на Roll20 нотацию.
 * Группировка по функциональности.
 */
export const DICE_RUSSIAN_OPERATORS: Record<string, string> = {
  // Базовые операторы
  'к': 'd', // кость (die)
  'кс': 'dF', // кость судьбы (fate die)

  // Keep (взять)
  'вл': 'kh', // взять лучшие (keep highest)
  'вх': 'kl', // взять худшие (keep lowest)

  // Drop (убрать)
  'ул': 'dh', // убрать лучшие (drop highest)
  'ух': 'dl', // убрать худшие (drop lowest)

  // Reroll (перебросить)
  'пр': 'ro', // переброс один раз (reroll once)
  'пб': 'r', // переброс (reroll)

  // Exploding (взрывающиеся)
  '!п': '!p', // проникающий (penetrate)

  // Модификаторы
  'с': 'm', // совпадение (match)
  'п': 'f', // провал (failure)

  // Сортировка
  'св': 'sa', // сортировка возрастание (sort ascending)
  'су': 'sd', // сортировка убывание (sort descending)
};
