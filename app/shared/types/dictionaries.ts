import type { AbilityKey, AbilityShortKey } from '~/shared/types';

export interface SelectOption {
  label: string;
  value: string;
  [p: string]: unknown;
}

export type SelectOptionWithNumericValue = Omit<SelectOption, 'value'> & {
  value: number;
};

export interface SelectOptionWithShortName extends SelectOption {
  shortName: string;
}

export interface SelectOptionWithMeasurable extends SelectOption {
  measurable: boolean;
}

export interface DiceSelectOption extends SelectOption {
  avg: number;
  maxValue: number;
}

export interface SpellcasterSelectOption extends SelectOption {
  levels: number;
}

export type AbilitySelectOption = Omit<SelectOption, 'value'> & {
  value: AbilityKey;
  key: AbilityShortKey;
};

export interface SkillSelectOption extends SelectOption {
  ability: AbilityKey;
}

export interface ChallengeRatingSelectOption
  extends SelectOptionWithNumericValue {
  pb: number;
}

export interface ArmorCategorySelectOption extends SelectOption {
  putting: string;
  removal: string;
}
