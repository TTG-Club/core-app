import type {
  EncounterBudget,
  GeneratedCreature,
  GenerationCandidate,
  GenerationDifficulty,
  GenerationWindow,
} from './types';

import {
  EXPERIENCE_BY_CHALLENGE_RATING,
  GENERATION_ATTEMPTS,
  GENERATION_COMPATIBILITY_SCORE,
  GENERATION_CREATURES_PER_CHARACTER,
  GENERATION_LEADER_RATIO,
  GENERATION_LOW_FLOOR_RATIO,
  GENERATION_MAX_CREATURES,
  GENERATION_MAX_KINDS,
  GENERATION_MIN_CREATURES,
  GENERATION_REPEAT_CHANCE,
  GENERATION_STOP_CHANCE,
} from './constants';

/** Источник случайных чисел в диапазоне [0, 1) — подменяется в тестах. */
export type RandomSource = () => number;

/**
 * Нижняя граница опыта для сложности: для низкой — доля её бюджета, для
 * остальных — бюджет предыдущей сложности плюс один (её граница уже занята).
 * @param difficulty Целевая сложность.
 * @param budget Бюджет группы.
 */
function getDifficultyFloor(
  difficulty: GenerationDifficulty,
  budget: EncounterBudget,
): number {
  if (difficulty === 'low') {
    return Math.ceil(budget.low * GENERATION_LOW_FLOOR_RATIO);
  }

  return (difficulty === 'moderate' ? budget.low : budget.moderate) + 1;
}

/**
 * Считает, сколько опыта генератор должен добавить к уже выбранным существам,
 * чтобы столкновение попало в целевую сложность.
 * @param difficulty Целевая сложность.
 * @param budget Бюджет группы.
 * @param currentExperience Опыт уже добавленных существ.
 * @returns Диапазон опыта либо `null`, если бюджет сложности уже исчерпан.
 */
export function getGenerationWindow(
  difficulty: GenerationDifficulty,
  budget: EncounterBudget,
  currentExperience: number,
): GenerationWindow | null {
  const max = budget[difficulty] - currentExperience;

  if (max <= 0) {
    return null;
  }

  return {
    min: Math.max(
      1,
      getDifficultyFloor(difficulty, budget) - currentExperience,
    ),
    max,
  };
}

/**
 * Значения опыта всех уровней опасности, что умещаются в бюджет, — по ним
 * бестиарий отбирает кандидатов (фильтр `cr` принимает опыт).
 * @param maxExperience Наибольший допустимый опыт одного существа.
 */
export function getAffordableExperienceValues(
  maxExperience: number,
): Array<number> {
  return Object.values(EXPERIENCE_BY_CHALLENGE_RATING).filter(
    (experience) => experience <= maxExperience,
  );
}

/**
 * Сколько существ генератор может положить в столкновение: по два на
 * персонажа, но не меньше и не больше заданных пределов.
 * @param characterCount Число персонажей в группе.
 */
export function getGenerationCreatureLimit(characterCount: number): number {
  return Math.min(
    GENERATION_MAX_CREATURES,
    Math.max(
      GENERATION_MIN_CREATURES,
      characterCount * GENERATION_CREATURES_PER_CHARACTER,
    ),
  );
}

/**
 * Случайный элемент массива.
 * @param items Непустой массив.
 * @param random Источник случайных чисел.
 */
function pickRandom<T>(
  items: ReadonlyArray<T>,
  random: RandomSource,
): T | undefined {
  return items[Math.floor(random() * items.length)];
}

/**
 * Случайный элемент с учётом весов: элемент с весом 8 выпадает вчетверо
 * чаще элемента с весом 2.
 * @param items Пары «элемент — положительный вес».
 * @param random Источник случайных чисел.
 */
function pickWeighted<T>(
  items: ReadonlyArray<{ item: T; weight: number }>,
  random: RandomSource,
): T | undefined {
  const total = items.reduce((sum, { weight }) => sum + weight, 0);

  let roll = random() * total;

  for (const { item, weight } of items) {
    roll -= weight;

    if (roll < 0) {
      return item;
    }
  }

  return items.at(-1)?.item;
}

/**
 * Сторона мировоззрения на оси добро — зло: `1` добро, `-1` зло, `0`
 * нейтральность или мировоззрение неизвестно.
 * @param alignment Код мировоззрения (`LAWFUL_GOOD`).
 */
function getMoralSide(alignment: string): number {
  if (alignment.endsWith('GOOD')) {
    return 1;
  }

  return alignment.endsWith('EVIL') ? -1 : 0;
}

/**
 * Насколько кандидат подходит главарю в свиту. Ноль — связи нет или они по
 * разные стороны добра и зла (паладин не водит культистов), если только
 * бестиарий явно не называет их спутниками.
 * @param leader Главарь группы.
 * @param candidate Кандидат в свиту.
 */
export function getCompatibilityScore(
  leader: GenerationCandidate,
  candidate: GenerationCandidate,
): number {
  if (
    leader.companions.includes(candidate.url)
    || candidate.companions.includes(leader.url)
  ) {
    return GENERATION_COMPATIBILITY_SCORE.companion;
  }

  if (getMoralSide(leader.alignment) * getMoralSide(candidate.alignment) < 0) {
    return 0;
  }

  if (leader.family && leader.family === candidate.family) {
    return GENERATION_COMPATIBILITY_SCORE.family;
  }

  if (leader.subtype && leader.subtype === candidate.subtype) {
    return GENERATION_COMPATIBILITY_SCORE.subtype;
  }

  return leader.typeCodes.some((code) => candidate.typeCodes.includes(code))
    ? GENERATION_COMPATIBILITY_SCORE.type
    : 0;
}

/** Кандидат в свиту и его вес при случайном выборе. */
interface RetinueOption {
  item: GenerationCandidate;
  weight: number;
}

/**
 * Свита главаря: существа не сильнее его, с весом по совместимости. Если
 * совместимых нет совсем, годится любое существо с равным весом — группа
 * выйдет без общей темы, зато сложность будет достигнута.
 * @param pool Кандидаты, каждый из которых умещается в бюджет.
 * @param leader Главарь группы.
 * @returns Свита и признак, что она тематическая.
 */
function getRetinue(
  pool: ReadonlyArray<GenerationCandidate>,
  leader: GenerationCandidate,
): { options: Array<RetinueOption>; isThemed: boolean } {
  const weaker = pool.filter(
    (candidate) =>
      candidate.url !== leader.url && candidate.experience <= leader.experience,
  );

  const themed = weaker
    .map((item) => ({ item, weight: getCompatibilityScore(leader, item) }))
    .filter(({ weight }) => weight > 0);

  if (themed.length) {
    return { options: themed, isThemed: true };
  }

  return {
    options: weaker.map((item) => ({ item, weight: 1 })),
    isThemed: false,
  };
}

/** Промежуточный итог одной попытки генерации. */
interface GenerationAttempt {
  picks: Array<GeneratedCreature>;
  total: number;

  /** Свита подобрана по совместимости, а не наугад. */
  isThemed: boolean;
}

/**
 * Добавляет существо в итог попытки: повтор увеличивает счётчик, новое
 * существо — новую строку.
 * @param picks Уже выбранные существа.
 * @param next Добавляемое существо.
 */
function addPick(
  picks: Array<GeneratedCreature>,
  next: GenerationCandidate,
): Array<GeneratedCreature> {
  return picks.some(({ candidate }) => candidate.url === next.url)
    ? picks.map((pick) =>
        pick.candidate.url === next.url
          ? { ...pick, count: pick.count + 1 }
          : pick,
      )
    : [...picks, { candidate: next, count: 1 }];
}

/**
 * Одна попытка: сначала «главарь» заметной доли бюджета, затем свита —
 * чаще копии уже выбранных существ, реже новые, совместимые с главарём,
 * пока опыт не попадёт в окно и не сработает случайная остановка либо не
 * кончится бюджет.
 * @param pool Кандидаты, каждый из которых умещается в бюджет.
 * @param window Диапазон опыта, который надо добавить.
 * @param creatureLimit Сколько существ можно добавить.
 * @param random Источник случайных чисел.
 */
function runAttempt(
  pool: ReadonlyArray<GenerationCandidate>,
  window: GenerationWindow,
  creatureLimit: number,
  random: RandomSource,
): GenerationAttempt {
  const leaders = pool.filter(
    ({ experience }) => experience >= window.max * GENERATION_LEADER_RATIO,
  );

  const leader = pickRandom(leaders.length ? leaders : pool, random);

  if (!leader) {
    return { picks: [], total: 0, isThemed: false };
  }

  const retinue = getRetinue(pool, leader);

  let picks: Array<GeneratedCreature> = [{ candidate: leader, count: 1 }];
  let total = leader.experience;
  let creatureCount = 1;

  while (creatureCount < creatureLimit) {
    const remaining = window.max - total;

    if (total >= window.min && random() < GENERATION_STOP_CHANCE) {
      break;
    }

    const repeatable = picks.filter(
      ({ candidate }) => candidate.experience <= remaining,
    );

    const newcomers =
      picks.length < GENERATION_MAX_KINDS
        ? retinue.options.filter(
            ({ item }) =>
              item.experience <= remaining
              && !picks.some(({ candidate }) => candidate.url === item.url),
          )
        : [];

    const shouldRepeat =
      repeatable.length > 0
      && (newcomers.length === 0 || random() < GENERATION_REPEAT_CHANCE);

    const next = shouldRepeat
      ? pickRandom(repeatable, random)?.candidate
      : pickWeighted(newcomers, random);

    if (!next) {
      break;
    }

    picks = addPick(picks, next);
    total += next.experience;
    creatureCount += 1;
  }

  return {
    picks,
    total,
    // Группа из одного вида (три рыцаря) тоже тематическая.
    isThemed: retinue.isThemed || picks.length === 1,
  };
}

/**
 * Подбирает случайных существ так, чтобы их суммарный опыт попал в окно.
 * Делает несколько попыток и берёт первую удачную с тематической свитой;
 * если таких нет — первую удачную, а если нет и их — попытку с наибольшим
 * опытом (он всегда не больше верхней границы).
 * @param candidates Существа бестиария с известным опытом.
 * @param window Диапазон опыта, который надо добавить.
 * @param creatureLimit Сколько существ можно добавить.
 * @param random Источник случайных чисел.
 * @returns Существа с количествами; пустой массив — подобрать некого.
 */
export function generateCreatures(
  candidates: ReadonlyArray<GenerationCandidate>,
  window: GenerationWindow,
  creatureLimit: number,
  random: RandomSource = Math.random,
): Array<GeneratedCreature> {
  const pool = candidates.filter(
    ({ experience }) => experience > 0 && experience <= window.max,
  );

  if (!pool.length || creatureLimit < 1) {
    return [];
  }

  let fallback: GenerationAttempt | undefined;
  let best: GenerationAttempt = { picks: [], total: 0, isThemed: false };

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const result = runAttempt(pool, window, creatureLimit, random);

    if (result.total >= window.min) {
      if (result.isThemed) {
        return result.picks;
      }

      fallback ??= result;
    }

    if (result.total > best.total) {
      best = result;
    }
  }

  return (fallback ?? best).picks;
}
