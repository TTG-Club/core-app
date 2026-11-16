import type { EncounterState, GenerationCandidate } from './types';

import { z } from 'zod';

import {
  DEFAULT_ENCOUNTER_STATE,
  MAX_CHARACTER_LEVEL,
  MAX_CREATURE_ROWS,
  MAX_PARTY_ROWS,
  MAX_ROW_COUNT,
  MIN_CHARACTER_LEVEL,
  MIN_ROW_COUNT,
} from './constants';
import { getExperienceByChallengeRating } from './utils';

const rowCountSchema = z.number().int().min(MIN_ROW_COUNT).max(MAX_ROW_COUNT);

const partyRowSchema = z.object({
  id: z.string(),
  level: z.number().int().min(MIN_CHARACTER_LEVEL).max(MAX_CHARACTER_LEVEL),
  count: rowCountSchema,
});

const creatureSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  challengeRating: z.string(),
  experience: z.number().min(0),
  experienceInLair: z.number().min(0).optional(),
  inLair: z.boolean(),
  count: rowCountSchema,
});

const encounterStateSchema = z.object({
  party: z.array(partyRowSchema).max(MAX_PARTY_ROWS),
  creatures: z.array(creatureSchema).max(MAX_CREATURE_ROWS),
});

/**
 * Валидирует состояние калькулятора, прочитанное из localStorage. Повреждённое
 * или чужое значение даёт начальное состояние, а не исключение.
 * @param input Сырое значение из хранилища.
 */
export function parseEncounterState(input: unknown): EncounterState {
  const result = encounterStateSchema.safeParse(input);

  return result.success ? result.data : DEFAULT_ENCOUNTER_STATE;
}

/** Существо из поиска бестиария с полями, по которым генератор строит группу. */
const generationCandidateSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  challengeRailing: z.string().catch(''),
  experience: z.number().nullish().catch(null),
  experienceInLair: z.number().nullish().catch(null),
  typeCodes: z.array(z.string()).nullish().catch(null),
  subtype: z.string().nullish().catch(null),
  family: z.string().nullish().catch(null),
  alignment: z.string().nullish().catch(null),
  companions: z.array(z.string()).nullish().catch(null),
});

const generationSearchResponseSchema = z
  .union([
    z.array(generationCandidateSchema),
    z.object({ value: z.array(generationCandidateSchema) }),
  ])
  .catch([]);

/**
 * Приводит опыт к числу: отсутствующее или отрицательное значение (так
 * бэкенд помечает неизвестный опыт) даёт `undefined`.
 * @param value Сырое значение опыта.
 */
function toExperience(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && value >= 0 ? value : undefined;
}

/**
 * Разбирает ответ `/api/v2/bestiary/search` в кандидатов генератора. Опыт,
 * которого бэкенд не прислал, берётся по уровню опасности; строки сравнения
 * (подтип, семейство) приводятся к нижнему регистру.
 * @param input Сырой ответ бестиария.
 */
export function parseGenerationCandidates(
  input: unknown,
): Array<GenerationCandidate> {
  const parsed = generationSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((creature) => {
    const experienceInLair = toExperience(creature.experienceInLair);

    return {
      url: creature.url,
      label: creature.name.rus,
      challengeRating: creature.challengeRailing,
      experience:
        toExperience(creature.experience)
        ?? getExperienceByChallengeRating(creature.challengeRailing),
      ...(experienceInLair === undefined ? {} : { experienceInLair }),
      typeCodes: creature.typeCodes ?? [],
      subtype: creature.subtype?.trim().toLowerCase() ?? '',
      family: creature.family?.trim().toLowerCase() ?? '',
      alignment: creature.alignment ?? '',
      companions: creature.companions ?? [],
    };
  });
}
