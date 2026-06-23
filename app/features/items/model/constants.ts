import type { SelectOption } from '~/shared/types';

import type { DexterityMod, ItemCategory } from './create';

/** Категории предмета для селектора в форме заполнения. */
export const ITEM_CATEGORY_OPTIONS: Array<
  SelectOption & { value: ItemCategory }
> = [
  { label: 'Оружие', value: 'WEAPON' },
  { label: 'Доспех', value: 'ARMOR' },
  { label: 'Прочее', value: 'ITEM' },
];

/** Варианты добавления модификатора Ловкости к классу доспеха. */
export const DEXTERITY_MOD_OPTIONS: Array<
  SelectOption & { value: DexterityMod }
> = [
  { label: '+ модификатор Ловкости', value: 'PLUS' },
  { label: '+ модификатор Ловкости (максимум +2)', value: 'PLUS_MAX_2' },
  { label: 'Без модификатора Ловкости', value: 'NONE' },
];
