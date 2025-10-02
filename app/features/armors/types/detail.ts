import type { ItemDetailResponse } from '~items/types';

export interface ArmorDetailResponse extends ItemDetailResponse {
  armorCategory: string; // категория доспеха
  armorClass: string; // класс доспеха
  strength: number | undefined; // требование к Силе
  stealth: boolean; // помеха на скрытность
}
