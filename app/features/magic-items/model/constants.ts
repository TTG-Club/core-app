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

/** Вкладки формы магического предмета. */
export const MAGIC_ITEM_EDITOR_TABS = {
  main: 'Основное',
  properties: 'Свойства',
  usage: 'Применение',
  effects: 'Эффекты',
} as const;

/** Заголовки карточек формы. */
export const MAGIC_ITEM_EDITOR_SECTIONS = {
  details: 'Подробности',
  description: 'Описание',
  images: 'Изображения',
  base: 'Немагическая основа',
  bonuses: 'Бонусы и свойства',
  damage: 'Дополнительный урон',
  usage: 'Влияние на лист персонажа',
} as const;

/** Подписи полей формы магического предмета. */
export const MAGIC_ITEM_FORM_LABELS = {
  category: 'Категория',
  categoryClarification: 'Уточнение категории',
  categoryClarificationPlaceholder: 'Введи уточнение категории',
  rarity: 'Редкость',
  rarityPlaceholder: 'Выбери редкость',
  rarityVaries: 'Текст редкости',
  rarityVariesPlaceholder: 'Введи текст для варьируемой редкости',
  attunementRequires: 'Требуется настройка',
  attunementDescription: 'Особенности настройки',
  attunementDescriptionPlaceholder: 'Введи особенности настройки (если есть)',
  curse: 'Проклятие',
  consumable: 'Расходуемый',
  descriptionPlaceholder: 'Введи описание',
  image: 'Основное',
  imageHint:
    'Эта картинка отображается при просмотре страницы магического предмета',
  baseItems: 'Связанные предметы',
  baseItemsHint:
    'Выбери обычные предметы, на основе которых создан магический. Их вес и стоимость используются при экспорте в VTTG и для фильтра. Можно выбрать несколько.',
  bonusAttack: 'Бонус к атаке',
  bonusAttackHint:
    'Например, 1 у оружия +1. Отрицательный — у проклятых предметов',
  bonusDamage: 'Бонус к урону',
  bonusDamageHint: 'Прибавляется к броску урона немагического предмета',
  bonusArmorClass: 'Бонус к КД',
  bonusArmorClassHint:
    'Прибавляется к классу доспеха — у доспехов, щитов и плащей защиты',
  bonusPlaceholder: 'Введи бонус',
  focus: 'Заклинательная фокусировка',
  focusHint: 'Посохи, волшебные палочки и жезлы, которыми колдуют',
  adamantine: 'Адамантиновый',
  adamantineHint: 'Отдельное свойство экипировки в системе D&D',
  activation: 'Условие применения',
  activationHint:
    'Когда эффекты включены. Требование настройки задаётся отдельно и проверяется вдобавок',
  activationPlaceholder: 'Выбери условие',
  passive: 'Пассивные свойства',
  passiveHint:
    'То, что лист показывает справкой, но не считает: дыхание под водой, иммунитет к чтению мыслей',
  passivePlaceholder: 'Например: вы можете дышать под водой',
  maxCharges: 'Максимум зарядов',
  maxChargesHint: 'Пусто — зарядов у предмета нет',
  maxChargesPlaceholder: 'Введи максимум',
  recharge: 'Формула восстановления',
  rechargeHint: 'Сколько зарядов возвращается, например «1к6+4»',
  rechargePlaceholder: 'Введи формулу',
  rechargeEvent: 'Когда восстанавливаются',
  rechargeEventPlaceholder: 'Выбери событие',
  chargeCost: 'Стоимость применения',
  chargeCostHint: 'Сколько зарядов тратит одно использование',
  chargeCostPlaceholder: 'Заряды',
} as const;

/** Подсказки карточек формы. */
export const MAGIC_ITEM_FORM_HINTS = {
  base: 'Вес, стоимость и боевые параметры магический предмет берёт у немагической основы',
  usage:
    'Когда работает магия предмета, сколько у него зарядов и что лист показывает справкой',
  damage:
    'Кости, которые магия добавляет к броску немагической основы: «2к6 огнём» Огненного языка. Основной урон описывает сам базовый предмет',
} as const;

/** Текст на месте пустого списка частей дополнительного урона. */
export const MAGIC_ITEM_DAMAGE_EMPTY_LABEL =
  'Своего урона предмет не добавляет';

/** Названия строк блока свойств на странице раздела. */
export const MAGIC_ITEM_PROPERTY_LABELS = {
  attack: 'Бонус к атаке',
  damage: 'Бонус к урону',
  armorClass: 'Бонус к КД',
  extraDamage: 'Дополнительный урон',
  charges: 'Заряды',
  recharge: 'Восстановление',
  chargeCost: 'Расход на применение',
  passive: 'Пассивные свойства',
  traits: 'Свойства',
  focus: 'Заклинательная фокусировка',
  adamantine: 'Адамантиновый',
} as const;
