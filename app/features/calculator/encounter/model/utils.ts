import type {
  EncounterBudget,
  EncounterBudgetSegment,
  EncounterCreature,
  EncounterDifficulty,
  EncounterPartyRow,
  EncounterResult,
  EncounterTransferBatch,
} from './types';

import {
  EXPERIENCE_BUDGET_BY_LEVEL,
  EXPERIENCE_BY_CHALLENGE_RATING,
  MAX_CHARACTER_LEVEL,
  MIN_CHARACTER_LEVEL,
} from './constants';

const EMPTY_BUDGET: EncounterBudget = { low: 0, moderate: 0, high: 0 };

/**
 * Возвращает бюджет опыта одного персонажа по уровню (DMG 2024). Уровень вне
 * диапазона 1–20 прижимается к ближайшей границе.
 * @param level Уровень персонажа.
 */
export function getCharacterBudget(level: number): EncounterBudget {
  const clamped = Math.min(
    MAX_CHARACTER_LEVEL,
    Math.max(MIN_CHARACTER_LEVEL, Math.trunc(level)),
  );

  return EXPERIENCE_BUDGET_BY_LEVEL[clamped - 1] ?? EMPTY_BUDGET;
}

/**
 * Складывает бюджеты всех персонажей группы.
 * @param party Строки группы: уровень и число персонажей.
 */
export function getPartyBudget(
  party: Array<EncounterPartyRow>,
): EncounterBudget {
  return party.reduce<EncounterBudget>((total, row) => {
    const budget = getCharacterBudget(row.level);

    return {
      low: total.low + budget.low * row.count,
      moderate: total.moderate + budget.moderate * row.count,
      high: total.high + budget.high * row.count,
    };
  }, EMPTY_BUDGET);
}

/**
 * Опыт существа по уровню опасности; неизвестный уровень опасности даёт `0`.
 * @param challengeRating Уровень опасности строкой («1/4», «5»).
 */
export function getExperienceByChallengeRating(
  challengeRating: string,
): number {
  return EXPERIENCE_BY_CHALLENGE_RATING[challengeRating.trim()] ?? 0;
}

/**
 * Опыт за одно существо строки: в логове — опыт в логове, если он у существа
 * есть, иначе обычный.
 * @param creature Существо столкновения.
 */
export function getCreatureExperience(creature: EncounterCreature): number {
  if (creature.inLair && creature.experienceInLair !== undefined) {
    return creature.experienceInLair;
  }

  return creature.experience;
}

/**
 * Определяет сложность по потраченному бюджету: опыт, уложившийся в бюджет
 * низкой сложности, — низкая; в бюджет умеренной — умеренная; в бюджет
 * высокой — высокая; больше — `beyond`.
 * @param totalExperience Суммарный опыт существ.
 * @param budget Бюджет группы.
 */
export function getEncounterDifficulty(
  totalExperience: number,
  budget: EncounterBudget,
): EncounterDifficulty {
  if (totalExperience <= 0 || budget.high <= 0) {
    return 'none';
  }

  if (totalExperience <= budget.low) {
    return 'low';
  }

  if (totalExperience <= budget.moderate) {
    return 'moderate';
  }

  if (totalExperience <= budget.high) {
    return 'high';
  }

  return 'beyond';
}

/**
 * Считает столкновение по правилам DMG 2024: бюджет группы — сумма бюджетов
 * персонажей, опыт существ просто складывается (множителей за число существ
 * в редакции 2024 нет).
 * @param party Строки группы.
 * @param creatures Существа столкновения.
 */
export function calculateEncounter(
  party: Array<EncounterPartyRow>,
  creatures: Array<EncounterCreature>,
): EncounterResult {
  const budget = getPartyBudget(party);
  const characterCount = party.reduce((total, row) => total + row.count, 0);

  const totalExperience = creatures.reduce(
    (total, creature) =>
      total + getCreatureExperience(creature) * creature.count,
    0,
  );

  return {
    budget,
    totalExperience,
    characterCount,
    experiencePerCharacter:
      characterCount > 0 ? Math.floor(totalExperience / characterCount) : 0,
    difficulty: getEncounterDifficulty(totalExperience, budget),
  };
}

/**
 * Делит шкалу бюджета на три зоны (низкая, умеренная, высокая) и считает,
 * насколько каждая заполнена опытом. Вся шкала — бюджет высокой сложности.
 * @param totalExperience Суммарный опыт существ.
 * @param budget Бюджет группы.
 */
export function getBudgetSegments(
  totalExperience: number,
  budget: EncounterBudget,
): Array<EncounterBudgetSegment> {
  const zones: Array<{
    difficulty: EncounterBudgetSegment['difficulty'];
    start: number;
    end: number;
  }> = [
    { difficulty: 'low', start: 0, end: budget.low },
    { difficulty: 'moderate', start: budget.low, end: budget.moderate },
    { difficulty: 'high', start: budget.moderate, end: budget.high },
  ];

  return zones.map(({ difficulty, start, end }) => {
    const size = end - start;

    return {
      difficulty,
      width: budget.high > 0 ? size / budget.high : 0,
      fill:
        size > 0
          ? Math.min(1, Math.max(0, (totalExperience - start) / size))
          : 0,
    };
  });
}

/**
 * Пачки существ для трекера инициативы: одно существо — один запрос
 * добавления, даже если в калькуляторе оно стоит несколькими строками (в
 * логове и вне его). Порядок — как в калькуляторе.
 * @param creatures Существа калькулятора.
 */
export function getTransferBatches(
  creatures: ReadonlyArray<EncounterCreature>,
): Array<EncounterTransferBatch> {
  const counts = new Map<string, number>();

  creatures.forEach(({ url, count }) => {
    counts.set(url, (counts.get(url) ?? 0) + count);
  });

  return [...counts].map(([creatureUrl, count]) => ({ creatureUrl, count }));
}
