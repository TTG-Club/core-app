import type { ItemLinkResponse } from '~items/types';

export interface ArmorLinkResponse extends ItemLinkResponse {
  armorCategory: string;
}
