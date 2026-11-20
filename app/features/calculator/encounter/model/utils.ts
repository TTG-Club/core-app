import type {
  ChallengeRatingItem,
  CustomCreatureDraft,
  EncounterBudget,
  EncounterBudgetSegment,
  EncounterCreature,
  EncounterDifficulty,
  EncounterPartyRow,
  EncounterResult,
  EncounterTransferBatch,
} from './types';

import {
  CUSTOM_CREATURE_DEFAULT_NAME,
  CUSTOM_CREATURE_LABELS,
  EMPTY_BUDGET,
  EXPERIENCE_BUDGET_BY_LEVEL,
  EXPERIENCE_BY_CHALLENGE_RATING,
  MAX_CHARACTER_LEVEL,
  MIN_CHARACTER_LEVEL,
  NUMBER_LOCALE,
} from './constants';

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
 * Пункты выбора показателя опасности — все уровни таблицы опыта по порядку
 * (0, 1/8, 1/4, 1/2, 1 … 30) с опытом в подписи.
 */
export function getChallengeRatingItems(): Array<ChallengeRatingItem> {
  return Object.entries(EXPERIENCE_BY_CHALLENGE_RATING)
    .sort(([, left], [, right]) => left - right)
    .map(([challengeRating, experience]) => ({
      value: challengeRating,
      label: `${challengeRating} · ${formatExperience(experience)} ${CUSTOM_CREATURE_LABELS.experienceUnit}`,
    }));
}

/**
 * Свой ли это монстр мастера, а не существо из бестиария.
 * @param creature Существо столкновения.
 */
export function isCustomCreature(creature: EncounterCreature): boolean {
  return creature.url === undefined;
}

/**
 * Название своего монстра: введённое без пробелов по краям или название по
 * умолчанию.
 * @param name Введённое название.
 */
export function getCustomCreatureName(name: string): string {
  return name.trim() || CUSTOM_CREATURE_DEFAULT_NAME;
}

/**
 * Находит строку своего монстра с тем же названием и показателем опасности,
 * чтобы прибавить к ней количество вместо новой строки.
 * @param creatures Существа столкновения.
 * @param draft Что ввёл мастер.
 */
export function findCustomCreature(
  creatures: ReadonlyArray<EncounterCreature>,
  draft: CustomCreatureDraft,
): EncounterCreature | undefined {
  const name = getCustomCreatureName(draft.name);

  return creatures.find(
    (creature) =>
      isCustomCreature(creature)
      && creature.name === name
      && creature.challengeRating === draft.challengeRating,
  );
}

/**
 * Строит строку своего монстра: опыт берётся по показателю опасности из той
 * же таблицы, что и у существ бестиария.
 * @param id Идентификатор строки.
 * @param draft Что ввёл мастер.
 */
export function createCustomCreature(
  id: string,
  draft: CustomCreatureDraft,
): EncounterCreature {
  return {
    id,
    name: getCustomCreatureName(draft.name),
    challengeRating: draft.challengeRating,
    experience: getExperienceByChallengeRating(draft.challengeRating),
    inLair: false,
    count: draft.count,
  };
}

/**
 * Сколько своих монстров в столкновении — их в трекер не перенести.
 * @param creatures Существа столкновения.
 */
export function countCustomCreatures(
  creatures: ReadonlyArray<EncounterCreature>,
): number {
  return creatures.reduce(
    (total, creature) =>
      isCustomCreature(creature) ? total + creature.count : total,
    0,
  );
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
 * Без группы бюджет нулевой: зоны делят шкалу поровну, чтобы подписи не
 * слипались в одну точку.
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
      width: budget.high > 0 ? size / budget.high : 1 / zones.length,
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
 * логове и вне его). Порядок — как в калькуляторе. Свои монстры пропускаются:
 * трекер добавляет существ только из бестиария.
 * @param creatures Существа калькулятора.
 */
export function getTransferBatches(
  creatures: ReadonlyArray<EncounterCreature>,
): Array<EncounterTransferBatch> {
  const counts = new Map<string, number>();

  creatures.forEach(({ url, count }) => {
    if (url === undefined) {
      return;
    }

    counts.set(url, (counts.get(url) ?? 0) + count);
  });

  return [...counts].map(([creatureUrl, count]) => ({ creatureUrl, count }));
}

/**
 * Число опыта для показа: с пробелами между тысячами.
 * @param experience Опыт.
 */
export function formatExperience(experience: number): string {
  return experience.toLocaleString(NUMBER_LOCALE);
}

/**
 * Подпись шкалы для экранных читалок: какая доля бюджета высокой сложности
 * уже потрачена.
 * @param totalExperience Суммарный опыт существ.
 * @param budget Бюджет группы.
 */
export function getBudgetSpentLabel(
  totalExperience: number,
  budget: EncounterBudget,
): string {
  const percent =
    budget.high > 0 ? Math.round((totalExperience / budget.high) * 100) : 0;

  return `Потрачено ${percent}% бюджета высокой сложности`;
}
