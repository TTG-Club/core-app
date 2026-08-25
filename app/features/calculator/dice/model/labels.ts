import type {
  CheckKind,
  CheckRollPart,
  RollMode,
  RollModifiers,
  RollPart,
  RollToggleKey,
} from './types';

import { D20_SIDES } from './constants';

/** Режимы броска в порядке показа на кнопках. */
export const ROLL_MODES: ReadonlyArray<RollMode> = [
  'advantage',
  'disadvantage',
];

/**
 * Переключатели, не зависящие от формулы, — в порядке показа.
 * Они идут перед режимами, которые то появляются, то исчезают вместе с d20:
 * так кнопки не сдвигаются, пока формулу дописывают.
 */
export const ROLL_DAMAGE_TOGGLES: ReadonlyArray<RollToggleKey> = [
  'critical',
  'resistance',
];

/** Подпись переключателя рядом с формулой результата. */
export const ROLL_TOGGLE_LABELS: Readonly<Record<RollToggleKey, string>> = {
  advantage: 'преимущество',
  disadvantage: 'помеха',
  critical: 'крит. урон',
  resistance: 'сопротивление',
};

/** Подсказка на кнопке переключателя. */
export const ROLL_TOGGLE_HINTS: Readonly<Record<RollToggleKey, string>> = {
  advantage: 'Каждая одиночная d20 бросается дважды, остаётся лучшая',
  disadvantage: 'Каждая одиночная d20 бросается дважды, остаётся худшая',
  critical: 'Кости урона удваиваются — как при критическом попадании',
  resistance: 'Итог делится пополам с округлением вниз',
};

/** Цвет включённого переключателя. */
export const ROLL_TOGGLE_COLORS: Readonly<Record<RollToggleKey, string>> = {
  advantage: 'var(--color-success)',
  disadvantage: 'var(--color-error)',
  critical: 'var(--color-warning)',
  resistance: 'var(--color-info)',
};

/** Сокращение вида проверки: КД у атаки, СЛ у проверки сложности. */
export const CHECK_KIND_LABELS: Readonly<Record<CheckKind, string>> = {
  armorClass: 'КД',
  difficultyClass: 'СЛ',
};

/** Подпись удачного исхода: попадание у атаки, успех у проверки сложности. */
export const CHECK_SUCCESS_LABELS: Readonly<Record<CheckKind, string>> = {
  armorClass: 'Попадание',
  difficultyClass: 'Успех',
};

/** Подпись неудачного исхода: промах у атаки, провал у проверки сложности. */
export const CHECK_FAILURE_LABELS: Readonly<Record<CheckKind, string>> = {
  armorClass: 'Промах',
  difficultyClass: 'Провал',
};

/** Подпись критического попадания. */
export const CRITICAL_HIT_LABEL = 'Критическое попадание';

/** Подпись критического промаха: натуральная 1 в атаке по КД. */
export const CRITICAL_MISS_LABEL = 'Критический промах';

/**
 * Собирает подпись формулы вместе с включёнными переключателями.
 * Формула в поле ввода при этом не меняется, поэтому подпись — единственное,
 * что объясняет, почему результат отличается от написанного.
 *
 * @param formula - Формула броска
 * @param modifiers - Включённые переключатели
 * @returns Подпись для карточки результата
 *
 * @example
 * createRollLabel('d20 + 5', { mode: 'advantage', critical: false, resistance: false });
 * // 'd20 + 5 · преимущество'
 */
export function createRollLabel(
  formula: string,
  modifiers: RollModifiers,
): string {
  const suffixes: string[] = [];

  if (modifiers.mode) {
    suffixes.push(ROLL_TOGGLE_LABELS[modifiers.mode]);
  }

  if (modifiers.critical) {
    suffixes.push(ROLL_TOGGLE_LABELS.critical);
  }

  if (modifiers.resistance) {
    suffixes.push(ROLL_TOGGLE_LABELS.resistance);
  }

  return [formula, ...suffixes].join(' · ');
}

/**
 * Подписывает исход проверки словами, принятыми для её вида.
 *
 * @param check - Результат проверки из разбора броска
 * @returns Подпись исхода
 *
 * @example
 * getCheckOutcomeLabel({ kind: 'armorClass', outcome: 'critical', … });
 * // 'Критическое попадание'
 */
export function getCheckOutcomeLabel(check: CheckRollPart): string {
  if (check.outcome === 'critical') {
    return CRITICAL_HIT_LABEL;
  }

  if (check.outcome === 'hit') {
    return CHECK_SUCCESS_LABELS[check.kind];
  }

  if (check.kind === 'armorClass' && check.natural === 1) {
    return CRITICAL_MISS_LABEL;
  }

  return CHECK_FAILURE_LABELS[check.kind];
}

/** Подпись критического успеха на голом броске d20 без проверки. */
export const CRITICAL_SUCCESS_LABEL = 'Критический успех';

/** Подпись критического провала на голом броске d20 без проверки. */
export const CRITICAL_FAILURE_LABEL = 'Критический провал';

/** Баннер исхода над разбором броска. */
export interface RollBanner {
  label: string;
  success: boolean;
}

/**
 * Собирает баннер исхода броска.
 *
 * Если в формуле была проверка, показывается её исход. Если проверки не было,
 * крит определяется по единственной учтённой d20 — при нескольких
 * двадцатигранниках понятие натурального броска теряет смысл.
 *
 * @param parts - Разбор броска
 * @returns Баннер исхода либо null, если показывать нечего
 */
export function getRollBanner(parts: RollPart[]): RollBanner | null {
  const check = parts.find((part) => part.type === 'check');

  if (check) {
    return {
      label: getCheckOutcomeLabel(check),
      success: check.outcome !== 'miss',
    };
  }

  const keptD20Faces = parts.flatMap((part) =>
    part.type === 'dice' && part.sides === D20_SIDES
      ? part.faces.filter((face) => !face.dropped)
      : [],
  );

  if (keptD20Faces.length !== 1) {
    return null;
  }

  const value = keptD20Faces[0]?.value;

  if (value === D20_SIDES) {
    return { label: CRITICAL_SUCCESS_LABEL, success: true };
  }

  return value === 1 ? { label: CRITICAL_FAILURE_LABEL, success: false } : null;
}

/** Подписи карточки формулы. */
export const DICE_FORMULA_LABELS = {
  section: 'Формула броска',
  placeholder: 'Например: 2d6 + 4 или 2d20kh1',
  clear: 'Очистить формулу',
  roll: 'Бросить',
  analyze: 'Анализ',
  diceGroup: 'Быстрое добавление костей',
  increaseModifier: 'Увеличить модификатор',
  decreaseModifier: 'Уменьшить модификатор',
  dropLast: 'Убрать последний элемент',
  presetGroup: 'Готовые формулы и переключатели броска',
} as const;

/**
 * Подсказка на кнопке быстрого добавления кости.
 *
 * @param sides - Число граней кости
 * @returns Текст подсказки
 */
export function getAddDieTitle(sides: number): string {
  return `Добавить d${sides} в формулу`;
}
