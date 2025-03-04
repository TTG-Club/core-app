export interface SelectOption {
  label: string;
  value: string;
}

export interface DiceSelectOption extends SelectOption {
  maxValue: number;
}

export interface SpellcasterSelectOption extends SelectOption {
  levels: number;
}
