import type { MagicItemBonuses } from './create';

/** Бонус магического предмета отсутствует: поле не заполнено. */
export const MAGIC_ITEM_BONUS_NONE = 0;

/** Пустой набор бонусов: предмет ничего не добавляет поверх основы. */
export const EMPTY_MAGIC_ITEM_BONUSES: MagicItemBonuses = {
  attack: MAGIC_ITEM_BONUS_NONE,
  damage: MAGIC_ITEM_BONUS_NONE,
  armorClass: MAGIC_ITEM_BONUS_NONE,
};

/** Минимальный бонус магического предмета: у проклятых он отрицательный. */
export const MAGIC_ITEM_BONUS_MIN = -10;

/** Максимальный бонус магического предмета. */
export const MAGIC_ITEM_BONUS_MAX = 10;
