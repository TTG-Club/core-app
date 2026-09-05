/**
 * Метки вариантов стартового снаряжения. Выводятся из порядка вариантов —
 * так же, как их выводит API при отдаче сущности, поэтому в форме не хранятся.
 */
export const EQUIPMENT_OPTION_LABELS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ';

/** Сколько вариантов снаряжения показывать там, где снаряжение ещё не заполнено. */
export const DEFAULT_EQUIPMENT_OPTIONS_COUNT = 2;

/** Минимальное количество предмета в варианте — оно же значение новой строки. */
export const MIN_EQUIPMENT_ITEM_QUANTITY = 1;

/** Минимальное количество монет варианта. */
export const MIN_EQUIPMENT_COINS = 0;

/** Подписи редактора стартового снаряжения. */
export const STARTING_EQUIPMENT_EDITOR = {
  title: 'Варианты стартового снаряжения',
  addOption: 'Добавить вариант',
  optionTitle: 'Вариант',
  removeOption: 'Удалить вариант',
  addItem: 'Добавить предмет',
  item: 'Предмет',
  quantity: 'Количество',
  quantityPlaceholder: 'Введи количество',
  description: 'Уточнение',
  descriptionPlaceholder: 'Например: по вашему выбору',
  coins: 'Монеты',
  coinsHelp: 'Количество золотых монет варианта',
} as const;
