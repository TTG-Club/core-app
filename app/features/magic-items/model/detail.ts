import type { SourceResponse } from '~/shared/types';
import type { DamageFormulaPart } from '~ui/damage-formula';

import type { MagicItemBonuses, MagicItemMechanics } from './create';

export interface MagicItemDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  image: string;
  subtitle: string;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;

  /**
   * Структура предмета, которую страница показывает блоком свойств. Всё
   * необязательно: у большинства записей раздела заполнено только описание, и
   * блока им не рисуется.
   */
  bonuses?: MagicItemBonuses;
  damageParts?: Array<DamageFormulaPart>;
  mechanics?: MagicItemMechanics | null;
  focus?: boolean;
  adamantine?: boolean;
}
