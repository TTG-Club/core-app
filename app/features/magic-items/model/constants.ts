import type {
  MagicItemActivation,
  MagicItemBonuses,
  MagicItemRechargeEvent,
} from './create';

interface Option<Value extends string> {
  label: string;
  value: Value;
}

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

/** Условия, при которых работает механика предмета. */
export const MAGIC_ITEM_ACTIVATION_OPTIONS: Array<Option<MagicItemActivation>> =
  [
    { label: 'При себе', value: 'CARRIED' },
    { label: 'Надет', value: 'WORN' },
    { label: 'В руке', value: 'HELD' },
    { label: 'Экипирован', value: 'EQUIPPED' },
    { label: 'При использовании', value: 'CONSUMED' },
    { label: 'Вручную', value: 'MANUAL' },
  ];

/** События восстановления зарядов предмета. */
export const MAGIC_ITEM_RECHARGE_EVENT_OPTIONS: Array<
  Option<MagicItemRechargeEvent>
> = [
  { label: 'На рассвете', value: 'DAWN' },
  { label: 'После короткого отдыха', value: 'SHORT_REST' },
  { label: 'После продолжительного отдыха', value: 'LONG_REST' },
];

/** Максимум зарядов, который принимает форма. */
export const MAGIC_ITEM_CHARGES_MAX = 100;
