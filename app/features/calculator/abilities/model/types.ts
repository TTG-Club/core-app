import type { DiceRollItem } from '~/features/dice-roller/types';
import type { AbilityKey, NameResponse, SourceResponse } from '~/shared/types';

export type AbilityScores = Record<AbilityKey, number>;

export interface BonusSource {
  id: string;
  label: string;
  scores: Partial<AbilityScores>;
}

export interface TabState {
  scores: AbilityScores;
  isComplete: boolean;
}

export interface PointBuyState extends TabState {
  remainingPoints: number;
}

export interface RandomRollState extends TabState {
  rolls: number[]; // The 6 rolled numbers
  dice?: DiceRollItem[][]; // The individual dice values for each roll (6 arrays of 4 numbers)
  assignments: Record<number, AbilityKey | null>; // Index of roll -> assigned ability
}

export type TabMode = 'point-buy' | 'standard-array' | 'random';

export interface CalculatorAbilitiesClass {
  url: string;
  name: NameResponse;
  updatedAt: string;
  createdAt: string;
  levels: number[];
  source: SourceResponse;
}

export interface CalculatorAbilitiesFeat {
  url: string;
  category: string;
  prerequisite: string | null;
  repeatability: boolean;
  abilities: Array<string> | null;
  increase: number | null;
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
