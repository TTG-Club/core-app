import type { DiceFormulaExample } from './types';

export const DICE_MODAL_MIN_HEIGHT = 300;
export const DICE_MODAL_MAX_HEIGHT_RATIO = 0.9;
export const DICE_MODAL_INITIAL_HEIGHT = 450;

export const DICE_EXAMPLES_BASIC: DiceFormulaExample[] = [
  { formula: 'к20', note: 'одиночный куб' },
  { formula: '2к6+3', note: 'сумма с модификатором' },
  { formula: '(4к6вх3+2)*2', note: 'группировка' },
];

export const DICE_EXAMPLES_KEEP: DiceFormulaExample[] = [
  { formula: '4к6вх3', note: 'оставить худшие (kl3)' },
  { formula: '3к8вл1', note: 'оставить лучшие (kh3)' },
  { formula: '5к10ул2', note: 'убрать лучшие (dh2)' },
  { formula: '5к10ух2', note: 'убрать худшие (dl2)' },
];

export const DICE_EXAMPLES_REROLL: DiceFormulaExample[] = [
  { formula: 'к20пр1', note: 'переброс 1 (ro1)' },
  { formula: '10к6пб2', note: 'переброс 2 (r2)' },
  { formula: '8к6р<3', note: 'переброс <3' },
];

export const DICE_HISTORY_STORAGE_KEY = 'dice-roller:history';
