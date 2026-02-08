import type { AbilityKey } from '~/shared/types';

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
  assignments: Record<number, AbilityKey | null>; // Index of roll -> assigned ability
}

export type TabMode = 'point-buy' | 'standard-array' | 'random';
