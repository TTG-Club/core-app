import { AbilityKey } from '~/shared/types';

import type { AbilityScores } from './types';

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  [AbilityKey.STRENGTH]: 'Сила',
  [AbilityKey.DEXTERITY]: 'Ловкость',
  [AbilityKey.CONSTITUTION]: 'Телосложение',
  [AbilityKey.INTELLIGENCE]: 'Интеллект',
  [AbilityKey.WISDOM]: 'Мудрость',
  [AbilityKey.CHARISMA]: 'Харизма',
};

export const ABILITY_SHORT_LABELS: Record<AbilityKey, string> = {
  [AbilityKey.STRENGTH]: 'СИЛ',
  [AbilityKey.DEXTERITY]: 'ЛОВ',
  [AbilityKey.CONSTITUTION]: 'ТЕЛ',
  [AbilityKey.INTELLIGENCE]: 'ИНТ',
  [AbilityKey.WISDOM]: 'МДР',
  [AbilityKey.CHARISMA]: 'ХАР',
};

export const ABILITY_KEYS = Object.values(AbilityKey);

export const DEFAULT_SCORES: AbilityScores = {
  [AbilityKey.STRENGTH]: 8,
  [AbilityKey.DEXTERITY]: 8,
  [AbilityKey.CONSTITUTION]: 8,
  [AbilityKey.INTELLIGENCE]: 8,
  [AbilityKey.WISDOM]: 8,
  [AbilityKey.CHARISMA]: 8,
};

export const ZERO_SCORES: AbilityScores = {
  [AbilityKey.STRENGTH]: 0,
  [AbilityKey.DEXTERITY]: 0,
  [AbilityKey.CONSTITUTION]: 0,
  [AbilityKey.INTELLIGENCE]: 0,
  [AbilityKey.WISDOM]: 0,
  [AbilityKey.CHARISMA]: 0,
};

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
