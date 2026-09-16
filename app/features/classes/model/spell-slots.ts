import type { Level } from '~/shared/types';

import type { ClassInMulticlass } from './detail';

import { PACT_MAGIC_LABEL } from './constants';
import { CasterType } from './detail';

/**
 * Таблицы ячеек заклинаний по правилам D&D (2024). Живут в модели домена:
 * ими пользуется и таблица прогрессии класса, и лист персонажа.
 */

/** Круги ячеек общей таблицы мультикласса — колонки с первого по девятый. */
export const SPELL_SLOT_LEVELS: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Класс с Магией договора в сборке и его суммарный уровень. */
export interface PactMagicClass {
  className: string;
  level: number;
}

export const FULL_CASTER_SPELL_SLOTS: Record<Level, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
} as const;

export const HALF_CASTER_SPELL_SLOTS: Record<Level, number[]> = {
  1: [2, 0, 0, 0, 0],
  2: [2, 0, 0, 0, 0],
  3: [3, 0, 0, 0, 0],
  4: [3, 0, 0, 0, 0],
  5: [4, 2, 0, 0, 0],
  6: [4, 2, 0, 0, 0],
  7: [4, 3, 0, 0, 0],
  8: [4, 3, 0, 0, 0],
  9: [4, 3, 2, 0, 0],
  10: [4, 3, 2, 0, 0],
  11: [4, 3, 3, 0, 0],
  12: [4, 3, 3, 0, 0],
  13: [4, 3, 3, 1, 0],
  14: [4, 3, 3, 1, 0],
  15: [4, 3, 3, 2, 0],
  16: [4, 3, 3, 2, 0],
  17: [4, 3, 3, 3, 1],
  18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2],
  20: [4, 3, 3, 3, 2],
} as const;

export const THIRD_CASTER_SPELL_SLOTS: Record<Level, number[]> = {
  1: [0, 0, 0, 0],
  2: [0, 0, 0, 0],
  3: [2, 0, 0, 0],
  4: [3, 0, 0, 0],
  5: [3, 0, 0, 0],
  6: [3, 0, 0, 0],
  7: [4, 2, 0, 0],
  8: [4, 2, 0, 0],
  9: [4, 2, 0, 0],
  10: [4, 3, 0, 0],
  11: [4, 3, 0, 0],
  12: [4, 3, 0, 0],
  13: [4, 3, 2, 0],
  14: [4, 3, 2, 0],
  15: [4, 3, 2, 0],
  16: [4, 3, 3, 0],
  17: [4, 3, 3, 0],
  18: [4, 3, 3, 0],
  19: [4, 3, 3, 1],
  20: [4, 3, 3, 1],
} as const;

export const PACT_CASTER_SPELL_SLOTS_COUNT: Record<Level, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  7: 2,
  8: 2,
  9: 2,
  10: 2,
  11: 3,
  12: 3,
  13: 3,
  14: 3,
  15: 3,
  16: 3,
  17: 4,
  18: 4,
  19: 4,
  20: 4,
} as const;

export const PACT_CASTER_SPELL_SLOTS_LEVEL: Record<Level, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
  9: 5,
  10: 5,
  11: 5,
  12: 5,
  13: 5,
  14: 5,
  15: 5,
  16: 5,
  17: 5,
  18: 5,
  19: 5,
  20: 5,
} as const;

// Таблица ячеек заклинаний для мультиклассового заклинателя по правилам D&D 5 (2024)
export const MULTICLASS_SPELL_SLOTS: Record<Level, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
} as const;

/**
 * Классы с Магией договора в сборке мультикласса с их суммарными уровнями:
 * класс, взятый несколькими отрезками, считается один раз.
 *
 * @param multiclass - Отрезки сборки с бэкенда
 * @returns Классы-заклинатели договора; пусто — колдуна в сборке нет
 */
export function getPactMagicClasses(
  multiclass: Array<ClassInMulticlass> | undefined,
): Array<PactMagicClass> {
  const levelByClass = new Map<string, number>();

  for (const segment of multiclass ?? []) {
    if (segment.casterType !== CasterType.PACT) {
      continue;
    }

    levelByClass.set(
      segment.class,
      (levelByClass.get(segment.class) ?? 0) + segment.level,
    );
  }

  return [...levelByClass].map(([className, level]) => ({ className, level }));
}

/**
 * Уровень Магии договора сборки. По правилам 2024 года уровни колдуна не входят
 * в общий уровень заклинателя: ячейки договора считаются по ним отдельно, по
 * таблице колдуна, и восстанавливаются коротким отдыхом.
 *
 * @param multiclass - Отрезки сборки с бэкенда
 * @returns Суммарный уровень классов с Магией договора; 0 — их в сборке нет
 */
export function getPactMagicLevel(
  multiclass: Array<ClassInMulticlass> | undefined,
): number {
  return getPactMagicClasses(multiclass).reduce(
    (total, pactMagicClass) => total + pactMagicClass.level,
    0,
  );
}

/**
 * Подпись строки ячеек договора в таблице ячеек: «Магия договора (Колдун 1)».
 *
 * @param multiclass - Отрезки сборки с бэкенда
 * @returns Подпись с классами договора и их уровнями
 */
export function getPactMagicRowLabel(
  multiclass: Array<ClassInMulticlass> | undefined,
): string {
  const classes = getPactMagicClasses(multiclass)
    .map(
      (pactMagicClass) => `${pactMagicClass.className} ${pactMagicClass.level}`,
    )
    .join(', ');

  return classes ? `${PACT_MAGIC_LABEL} (${classes})` : PACT_MAGIC_LABEL;
}

/**
 * Ячейки Магии договора в раскладке общей таблицы: все ячейки одного круга, в
 * остальных кругах нули.
 *
 * @param pactMagicLevel - Уровень Магии договора
 * @returns Число ячеек по кругам с первого по девятый
 */
export function getPactSpellSlotsByLevel(pactMagicLevel: Level): number[] {
  const slotLevel = PACT_CASTER_SPELL_SLOTS_LEVEL[pactMagicLevel];
  const slotCount = PACT_CASTER_SPELL_SLOTS_COUNT[pactMagicLevel];

  return SPELL_SLOT_LEVELS.map((spellSlotLevel) =>
    spellSlotLevel === slotLevel ? slotCount : 0,
  );
}
