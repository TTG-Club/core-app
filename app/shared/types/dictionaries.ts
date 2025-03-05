import type { DefaultOptionType } from 'ant-design-vue/es/vc-select/Select';

export interface SelectOption extends DefaultOptionType {
  label: string;
  value: string;
}

export interface DiceSelectOption extends SelectOption {
  maxValue: number;
}

export interface SpellcasterSelectOption extends SelectOption {
  levels: number;
}
