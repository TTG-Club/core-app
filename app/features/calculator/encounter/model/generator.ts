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

/** Промежуточный итог одной попытки генерации. */
interface GenerationAttempt {
  picks: Array<GeneratedCreature>;
  total: number;
}

/**
 * Одна попытка: сначала «главарь» заметной доли бюджета, затем свита —
 * чаще копии уже выбранных существ, реже новые, пока опыт не попадёт в окно
 * и не сработает случайная остановка либо не кончится бюджет.
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
    return { picks: [], total: 0 };
  }

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
        ? pool.filter(({ experience }) => experience <= remaining)
        : [];

    const shouldRepeat =
      repeatable.length > 0
      && (newcomers.length === 0 || random() < GENERATION_REPEAT_CHANCE);

    const next = shouldRepeat
      ? pickRandom(repeatable, random)?.candidate
      : pickRandom(newcomers, random);

    if (!next) {
      break;
    }

    picks = picks.some(({ candidate }) => candidate.url === next.url)
      ? picks.map((pick) =>
          pick.candidate.url === next.url
            ? { ...pick, count: pick.count + 1 }
            : pick,
        )
      : [...picks, { candidate: next, count: 1 }];

    total += next.experience;
    creatureCount += 1;
  }

  return { picks, total };
}

/**
 * Подбирает случайных существ так, чтобы их суммарный опыт попал в окно.
 * Делает несколько попыток и берёт первую удачную; если удачных нет —
 * попытку с наибольшим опытом (он всегда не больше верхней границы).
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

  let best: GenerationAttempt = { picks: [], total: 0 };

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const result = runAttempt(pool, window, creatureLimit, random);

    if (result.total >= window.min) {
      return result.picks;
    }

    if (result.total > best.total) {
      best = result;
    }
  }

  return best.picks;
}
