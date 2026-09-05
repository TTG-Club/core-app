import type { RolledFace, RollPart } from './types';

import { CHECK_KIND_LABELS, getCheckOutcomeLabel } from './labels';

/** Как подсвечена кость: натуральный максимум, минимум или никак. */
export type FaceHighlight = 'none' | 'max' | 'min';

/** Одна кость в разборе броска, готовая к показу. */
export interface FaceView {
  key: string;
  value: number;
  rerolled: boolean;
  dropped: boolean;
  highlight: FaceHighlight;
  title: string;
}

/** Исход проверки в разборе броска, готовый к показу. */
export interface CheckView {
  label: string;
  success: boolean;
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
    return {
      key: `check-${index}`,
      label: `${part.total} против ${CHECK_KIND_LABELS[part.kind]} ${part.target}`,
      faces: [],
      check: {
        label: getCheckOutcomeLabel(part),
        success: part.outcome !== 'miss',
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
