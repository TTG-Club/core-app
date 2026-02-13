import type { DiceRollItem } from '~dice-roller/types';

import type { AbilityKey, NameResponse, SourceResponse } from '~/shared/types';

export type AbilityScores = Record<AbilityKey, number>;

export type BonusSourceType = 'background' | 'feat' | 'class' | 'epic';

export interface BonusSource {
  id: string;
  label: string;
  type: BonusSourceType;
  scores: Partial<AbilityScores>;
  maxScoreIncreases?: Partial<AbilityScores>;
  upto?: number;
}

export interface TabState {
  scores: AbilityScores;
  isComplete: boolean;
}

export interface PointBuyState extends TabState {
  remainingPoints: number;
}

export interface RandomRollState extends TabState {
  rolls: number[];
  dice?: DiceRollItem[][];
  assignments: Record<number, AbilityKey | null>;
}

export type TabMode = 'point-buy' | 'standard-array' | 'random';

export interface CalculatorAbilitiesClass {
  url: string;
  name: NameResponse;
  updatedAt: string;
  createdAt: string;
  levels: number[];
  source: SourceResponse;
  abilityBonus?: Array<CalculatorAbilitiesClassBonus>;

  /**
   * Шаблон распределения характеристик.
   * Backend отдаёт готовые значения (перестановка STANDARD_ARRAY)
   * в порядке ABILITY_KEYS.
   *
   * Пример: [8,14,12,13,10,15]
   */
  abilityTemplate?: Array<number>;
}

export interface CalculatorAbilitiesClassBonus {
  abilities: Array<AbilityKey>;
  bonus: number;
  upto: number;
  level: number;
}

export interface CalculatorClassOption {
  label: string;
  value: string;
  description: string;
  source: string;
}

export interface CalculatorFeatOption {
  label: string;
  value: string;
  description: string;
  source: string;
  prerequisite?: string;
  repeatability?: boolean;
  abilityScoreIncreaseOptions?: number;
}

export interface CalculatorAbilityOption {
  label: string;
  value: string;
}

export interface CalculatorBackgroundOption {
  label: string;
  value: string;
  description: string;
  sourceLabel: string;
}

export interface CalculatorAbilitiesFeat {
  url: string;
  category: string;
  prerequisite: string | null;
  repeatability: boolean;
  abilities: Array<string> | null;
  abilityScoreIncreaseOptions: number | null;
  source: SourceResponse;
  name: NameResponse & {
    alt?: Array<string> | null;
  };
}

export interface CalculatorAbilitiesBackground {
  url: string;
  name: NameResponse;
  abilityScores: Array<string> | null;
  source: SourceResponse;
}
