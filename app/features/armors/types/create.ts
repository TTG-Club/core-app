import type { ItemCreate } from '~items/types';

export interface ArmorCreate extends ItemCreate {
  armorCategory: string; // категория доспеха
  armorClass: string; // класс доспеха
  strength: string | undefined; // требование к Силе
  stealth: string | undefined; // помеха на скрытность
}
