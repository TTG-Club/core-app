import type { EncounterState } from './types';

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
