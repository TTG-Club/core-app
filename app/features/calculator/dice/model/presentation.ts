import type { RolledFace, RollPart } from './types';

import { CHECK_KIND_LABELS, getCheckOutcomeLabel } from './labels';

/** Как подсвечена кость: натуральный максимум, минимум или никак. */
export type FaceHighlight = 'none' | 'max' | 'min';

/** Классы кости по её подсветке. */
const FACE_HIGHLIGHT_CLASSES: Readonly<Record<FaceHighlight, string>> = {
  none: 'text-highlighted ring-accented',
  max: 'text-success ring-success bg-success/10',
  min: 'text-error ring-error bg-error/10',
};

/** Классы кости, которая не идёт в счёт. */
const DROPPED_FACE_CLASS = 'line-through opacity-40';

/** Класс подписи удачного исхода проверки. */
const CHECK_SUCCESS_CLASS = 'text-success';

/** Класс подписи неудачного исхода проверки. */
const CHECK_FAILURE_CLASS = 'text-error';

/** Настроение подноса: обычный бросок, удача или неудача. */
export type RollTone = 'neutral' | 'success' | 'failure';

/** Цвет кости и свечения подноса по настроению броска. */
export const ROLL_TONE_COLORS: Readonly<Record<RollTone, string>> = {
  neutral: 'var(--ui-primary)',
  success: 'var(--ui-success)',
  failure: 'var(--ui-error)',
};

/** Классы ленты исхода по настроению броска. */
export const ROLL_BANNER_CLASSES: Readonly<Record<RollTone, string>> = {
  neutral: 'text-muted ring-accented',
  success: 'text-success ring-success/60',
  failure: 'text-error ring-error/60',
};

/**
 * Кегль числа на кости по его длине: первое подходящее правило побеждает.
 * Двузначное число занимает грань целиком, длинные — ужимаются, чтобы
 * не вылезать за контур.
 */
const RESULT_VALUE_SIZE_RULES: ReadonlyArray<readonly [number, string]> = [
  [2, 'text-6xl sm:text-7xl'],
  [3, 'text-5xl sm:text-6xl'],
  [5, 'text-4xl sm:text-5xl'],
];

/** Кегль числа, которое длиннее всех правил. */
const RESULT_VALUE_SMALLEST_SIZE_CLASS = 'text-2xl sm:text-3xl';

/**
 * Подбирает кегль числа результата под кость.
 *
 * @param value - Число результата в том виде, в каком оно показано
 * @returns Классы размера шрифта
 *
 * @example
 * getResultValueSizeClass('17'); // 'text-6xl sm:text-7xl'
 */
export function getResultValueSizeClass(value: string): string {
  const rule = RESULT_VALUE_SIZE_RULES.find(
    ([maxLength]) => value.length <= maxLength,
  );

  return rule ? rule[1] : RESULT_VALUE_SMALLEST_SIZE_CLASS;
}

/** Одна кость в разборе броска, готовая к показу. */
export interface FaceView {
  key: string;
  value: number;
  rerolled: boolean;
  dropped: boolean;
  highlight: FaceHighlight;
  className: string;
  title: string;
}

/** Исход проверки в разборе броска, готовый к показу. */
export interface CheckView {
  label: string;
  success: boolean;
  className: string;
}

/** Строка разбора броска, готовая к показу. */
export interface RollPartView {
  key: string;
  label: string;
  faces: FaceView[];
  check: CheckView | null;
}

/**
 * Готовит кость к показу: подсвечивает выпавшие максимум и минимум
 * и объясняет, почему кость не учтена.
 *
 * Подсветка работает для любой кости, а не только для d20: в `6d6` шестёрки
 * и единицы читаются так же быстро, как натуральные 20 и 1 на двадцатиграннике.
 * Сброшенные и переброшенные кости не подсвечиваются — они не в счёте.
 *
 * @param face - Выпавшая грань
 * @param sides - Число граней кости
 * @param index - Порядковый номер кости в группе
 * @returns Кость, готовая к показу
 */
function createFaceView(
  face: RolledFace,
  sides: number,
  index: number,
): FaceView {
  let highlight: FaceHighlight = 'none';

  if (!face.dropped) {
    if (face.value === sides) {
      highlight = 'max';
    } else if (face.value === 1) {
      highlight = 'min';
    }
  }

  let title = `d${sides}`;

  if (face.dropped) {
    title += face.rerolled ? ' — переброшено' : ' — не учитывается';
  }

  return {
    key: `${index}-${face.value}`,
    value: face.value,
    rerolled: face.rerolled,
    dropped: face.dropped,
    highlight,
    className: face.dropped
      ? `${FACE_HIGHLIGHT_CLASSES[highlight]} ${DROPPED_FACE_CLASS}`
      : FACE_HIGHLIGHT_CLASSES[highlight],
    title,
  };
}

/**
 * Готовит строку разбора броска к показу.
 *
 * @param part - Строка разбора: группа костей или проверка
 * @param index - Порядковый номер строки
 * @returns Строка, готовая к показу
 *
 * @example
 * createRollPartView({ type: 'dice', sides: 6, label: '2d6', faces }, 0);
 */
export function createRollPartView(
  part: RollPart,
  index: number,
): RollPartView {
  if (part.type === 'check') {
    const success = part.outcome !== 'miss';

    return {
      key: `check-${index}`,
      label: `${part.total} против ${CHECK_KIND_LABELS[part.kind]} ${part.target}`,
      faces: [],
      check: {
        label: getCheckOutcomeLabel(part),
        success,
        className: success ? CHECK_SUCCESS_CLASS : CHECK_FAILURE_CLASS,
      },
    };
  }

  return {
    key: `dice-${index}`,
    label: part.label,
    faces: part.faces.map((face, faceIndex) =>
      createFaceView(face, part.sides, faceIndex),
    ),
    check: null,
  };
}
