import type {
  AbilityKey,
  ArmorProficiencyGroup,
  CharacterClassResource,
  CurrencyKey,
  FeatureOrigin,
  InventoryItemCategory,
  LanguageProficiencyGroup,
  ResourceRecovery,
  RollMode,
  SheetTab,
  SkillProficiencyLevel,
  SpeedTypeKey,
  SpeedUnit,
  ToolProficiencyGroup,
  VisionKey,
  WeaponProficiencyGroup,
} from './types';

/** Название инструмента «Лист персонажа». */
export const CHARACTER_SHEET_TITLE = 'Лист персонажа';

/** Сообщение при попытке редактирования заблокированного листа. */
export const SHEET_LOCKED_MESSAGE = 'Лист заблокирован от редактирования';

/** Порядок отображения характеристик. */
export const ABILITY_ORDER: AbilityKey[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

/** Полные названия характеристик. */
export const ABILITY_LABELS: Record<AbilityKey, string> = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  constitution: 'Телосложение',
  intelligence: 'Интеллект',
  wisdom: 'Мудрость',
  charisma: 'Харизма',
};

/** Сокращённые названия характеристик. */
export const ABILITY_SHORT_LABELS: Record<AbilityKey, string> = {
  strength: 'Сил',
  dexterity: 'Лов',
  constitution: 'Тел',
  intelligence: 'Инт',
  wisdom: 'Мдр',
  charisma: 'Хар',
};

/** Порядок отображения денежных единиц. */
export const CURRENCY_ORDER: CurrencyKey[] = [
  'copper',
  'silver',
  'electrum',
  'gold',
  'platinum',
];

/** Сокращённые названия денежных единиц. */
export const CURRENCY_LABELS: Record<CurrencyKey, string> = {
  copper: 'ММ',
  silver: 'СМ',
  electrum: 'ЭМ',
  gold: 'ЗМ',
  platinum: 'ПМ',
};

/** Минимальный уровень персонажа. */
export const LEVEL_MIN = 1;

/** Максимальный уровень персонажа. */
export const LEVEL_MAX = 20;

/** Максимальное значение опыта. */
export const EXPERIENCE_MAX = 999999;

/**
 * Суммарный опыт, необходимый для достижения уровня (индекс = уровень − 1).
 * Таблица опыта D&D 2024.
 */
export const LEVEL_XP_THRESHOLDS: number[] = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

/** Названия типов восстановления ресурса класса. */
export const RESOURCE_RECOVERY_LABELS: Record<ResourceRecovery, string> = {
  'short-rest': 'Короткий отдых',
  'long-rest': 'Продолжительный отдых',
};

/** Варианты восстановления для селекта в настройке ресурсов. */
export const RESOURCE_RECOVERY_OPTIONS: Array<{
  label: string;
  value: ResourceRecovery;
}> = [
  { label: 'Короткий отдых', value: 'short-rest' },
  { label: 'Продолжительный отдых', value: 'long-rest' },
];

/** Иконки типов восстановления ресурса класса. */
export const RESOURCE_RECOVERY_ICONS: Record<ResourceRecovery, string> = {
  'short-rest': 'tabler:campfire',
  'long-rest': 'tabler:sun',
};

/** Минимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MIN = 0;

/** Максимальное количество зарядов ресурса. */
export const RESOURCE_COUNT_MAX = 99;

/** Максимальная длина короткой подписи ресурса. */
export const RESOURCE_SHORT_LABEL_MAX_LENGTH = 4;

/** Заготовка нового ресурса класса (без идентификатора). */
export const NEW_CLASS_RESOURCE: Omit<CharacterClassResource, 'id'> = {
  name: 'Новый счётчик',
  shortLabel: 'НС',
  recovery: 'long-rest',
  current: 1,
  max: 1,
};

/** Минимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MIN = 0;

/** Максимальное базовое значение класса доспеха. */
export const ARMOR_CLASS_BASE_MAX = 40;

/** Значение «без характеристики» в селекте класса доспеха. */
export const ARMOR_CLASS_NO_ABILITY = 'none';

/** Варианты характеристики для бонуса класса доспеха. */
export const ARMOR_CLASS_ABILITY_OPTIONS: Array<{
  label: string;
  value: AbilityKey | typeof ARMOR_CLASS_NO_ABILITY;
}> = [
  { label: 'Нет', value: ARMOR_CLASS_NO_ABILITY },
  ...ABILITY_ORDER.map((key) => ({ label: ABILITY_LABELS[key], value: key })),
];

/** Минимальное значение характеристики. */
export const ABILITY_SCORE_MIN = 1;

/** Максимальное значение характеристики. */
export const ABILITY_SCORE_MAX = 30;

/** Названия уровней владения навыком. */
export const SKILL_PROFICIENCY_LABELS: Record<SkillProficiencyLevel, string> = {
  none: 'Нет владения',
  half: 'Половина владения',
  proficient: 'Владение',
  expertise: 'Экспертиза',
};

/** Следующий уровень владения навыком при переключении по кругу. */
export const SKILL_PROFICIENCY_NEXT: Record<
  SkillProficiencyLevel,
  SkillProficiencyLevel
> = {
  none: 'half',
  half: 'proficient',
  proficient: 'expertise',
  expertise: 'none',
};

/** Иконки уровней владения навыком. */
export const SKILL_PROFICIENCY_ICONS: Record<SkillProficiencyLevel, string> = {
  none: 'tabler:circle',
  half: 'tabler:circle-half-2',
  proficient: 'tabler:circle-filled',
  expertise: 'tabler:square-rounded-chevrons-up',
};

/** Множители бонуса мастерства по уровню владения навыком. */
export const SKILL_PROFICIENCY_MULTIPLIERS: Record<
  SkillProficiencyLevel,
  number
> = {
  none: 0,
  half: 0.5,
  proficient: 1,
  expertise: 2,
};

/** Множитель грузоподъёмности от значения Силы. */
export const CARRYING_CAPACITY_MULTIPLIER = 15;

/** Единица измерения веса инвентаря. */
export const WEIGHT_UNIT_LABEL = 'фнт.';

/** Названия типов передвижения. */
export const SPEED_TYPE_LABELS: Record<SpeedTypeKey, string> = {
  walk: 'Ходьба',
  burrow: 'Копание',
  climb: 'Лазание',
  fly: 'Полёт',
  swim: 'Плавание',
};

/** Порядок типов передвижения в модалке настройки. */
export const SPEED_MODAL_ORDER: SpeedTypeKey[] = [
  'burrow',
  'climb',
  'fly',
  'swim',
  'walk',
];

/**
 * Порядок выбора основного типа передвижения: при равных скоростях приоритет у
 * ходьбы.
 */
export const SPEED_PRIMARY_ORDER: SpeedTypeKey[] = [
  'walk',
  'burrow',
  'climb',
  'fly',
  'swim',
];

/** Сокращённые обозначения единиц скорости. */
export const SPEED_UNIT_SHORT_LABELS: Record<SpeedUnit, string> = {
  feet: 'фт',
  meters: 'м',
  miles: 'ми',
  kilometers: 'км',
};

/** Варианты единиц скорости для выбора в модалке. */
export const SPEED_UNIT_OPTIONS: Array<{ label: string; value: SpeedUnit }> = [
  { label: 'Футы (ft)', value: 'feet' },
  { label: 'Метры (m)', value: 'meters' },
  { label: 'Мили (mi)', value: 'miles' },
  { label: 'Километры (km)', value: 'kilometers' },
];

/** Варианты режима броска d20. */
export const ROLL_MODE_OPTIONS: Array<{
  value: RollMode;
  label: string;
  icon?: string;
}> = [
  { value: 'normal', label: 'Обычный' },
  { value: 'advantage', label: 'Преим.', icon: 'tabler:arrow-big-up-filled' },
  {
    value: 'disadvantage',
    label: 'Помеха',
    icon: 'tabler:arrow-big-down-filled',
  },
];

/** Нотация кубов d20 по режиму броска (нотация дайс-роллера). */
export const ROLL_MODE_DICE_NOTATION: Record<RollMode, string> = {
  normal: '1к20',
  advantage: '2к20вл1',
  disadvantage: '2к20вх1',
};

/** Минимальный дополнительный бонус броска. */
export const ROLL_BONUS_MIN = -99;

/** Максимальный дополнительный бонус броска. */
export const ROLL_BONUS_MAX = 99;

/** Названия типов зрения. */
export const VISION_LABELS: Record<VisionKey, string> = {
  normal: 'Обычное зрение',
  darkvision: 'Тёмное зрение',
};

/** Порядок типов зрения в модалке и подсказке. */
export const VISION_ORDER: VisionKey[] = ['normal', 'darkvision'];

/** Минимальная дистанция зрения. */
export const VISION_DISTANCE_MIN = 0;

/** Максимальная дистанция зрения. */
export const VISION_DISTANCE_MAX = 999;

/** Минимальное значение скорости. */
export const SPEED_VALUE_MIN = 0;

/** Максимальное значение скорости. */
export const SPEED_VALUE_MAX = 999;

/** Минимальное значение хитов. */
export const HIT_POINTS_MIN = 0;

/** Максимальное значение хитов. */
export const HIT_POINTS_MAX = 999;

/** Минимальное количество костей хитов. */
export const HIT_DICE_COUNT_MIN = 0;

/** Максимальное количество костей хитов. */
export const HIT_DICE_COUNT_MAX = 99;

/** Варианты номинала кости хитов для выбора в модалке. */
export const HIT_DIE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'к4', value: 4 },
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
];

/** Каталог брони для настройки владения: группы, пункт «вся группа» и виды. */
export const ARMOR_PROFICIENCY_GROUPS: ArmorProficiencyGroup[] = [
  {
    key: 'light',
    title: 'Лёгкая',
    all: 'Вся лёгкая броня',
    items: ['Стёганый доспех', 'Кожаный доспех', 'Проклёпанный кожаный доспех'],
  },
  {
    key: 'medium',
    title: 'Средняя',
    all: 'Вся средняя броня',
    items: [
      'Шкурный доспех',
      'Кольчужная рубаха',
      'Чешуйчатый доспех',
      'Нагрудник',
      'Полулатный доспех',
    ],
  },
  {
    key: 'heavy',
    title: 'Тяжёлая',
    all: 'Вся тяжёлая броня',
    items: ['Колечный доспех', 'Кольчуга', 'Наборный доспех', 'Латный доспех'],
  },
  {
    key: 'shields',
    title: 'Щиты',
    all: 'Все щиты',
    items: ['Щит'],
  },
];

/** Каталог оружия для настройки владения и мастерства: группы и виды. */
export const WEAPON_PROFICIENCY_GROUPS: WeaponProficiencyGroup[] = [
  {
    key: 'simple',
    title: 'Простое',
    all: 'Всё простое оружие',
    items: [
      'Дубинка',
      'Кинжал',
      'Палица',
      'Ручной топор',
      'Метательное копьё',
      'Лёгкий молот',
      'Булава',
      'Боевой посох',
      'Серп',
      'Копьё',
      'Дротик',
      'Короткий лук',
      'Лёгкий арбалет',
      'Праща',
    ],
  },
  {
    key: 'martial',
    title: 'Воинское',
    all: 'Всё воинское оружие',
    items: [
      'Боевой топор',
      'Цеп',
      'Глефа',
      'Секира',
      'Двуручный меч',
      'Алебарда',
      'Длинное копьё',
      'Длинный меч',
      'Молот',
      'Моргенштерн',
      'Пика',
      'Рапира',
      'Скимитар',
      'Короткий меч',
      'Трезубец',
      'Боевой клевец',
      'Боевой молот',
      'Кнут',
      'Духовая трубка',
      'Ручной арбалет',
      'Тяжёлый арбалет',
      'Длинный лук',
      'Мушкет',
      'Пистоль',
    ],
  },
];

/** Каталог инструментов для настройки владения: группы и виды. */
export const TOOL_PROFICIENCY_GROUPS: ToolProficiencyGroup[] = [
  {
    key: 'artisan',
    title: 'Инструменты ремесленника',
    all: 'Все инструменты ремесленника',
    items: [
      'Инструменты алхимика',
      'Инструменты пивовара',
      'Инструменты каллиграфа',
      'Инструменты плотника',
      'Инструменты картографа',
      'Инструменты сапожника',
      'Инструменты повара',
      'Инструменты стеклодува',
      'Инструменты ювелира',
      'Инструменты кожевника',
      'Инструменты каменщика',
      'Инструменты художника',
      'Инструменты гончара',
      'Инструменты кузнеца',
      'Инструменты ремонтника',
      'Инструменты ткача',
      'Инструменты резчика по дереву',
    ],
  },
  {
    key: 'gaming',
    title: 'Игровые наборы',
    all: 'Все игровые наборы',
    items: [
      'Набор костей',
      'Шахматы «Копьё дракона»',
      'Набор игральных карт',
      'Набор для игры «Три дракона»',
    ],
  },
  {
    key: 'musical',
    title: 'Музыкальные инструменты',
    all: 'Все музыкальные инструменты',
    items: [
      'Волынка',
      'Барабан',
      'Цимбалы',
      'Флейта',
      'Лютня',
      'Лира',
      'Рожок',
      'Флейта Пана',
      'Шалмей',
      'Виола',
    ],
  },
  {
    key: 'other',
    title: 'Прочие инструменты',
    all: 'Все прочие инструменты',
    items: [
      'Набор для маскировки',
      'Набор для фальсификации',
      'Набор травника',
      'Инструменты навигатора',
      'Набор отравителя',
      'Воровские инструменты',
    ],
  },
];

/** Эндпоинт поиска черт (раздел «Черты»). */
export const FEATS_SEARCH_PATH = '/api/v2/feats/search';

/** Базовый путь деталей черты (`/{url}`). */
export const FEATS_DETAIL_BASE_PATH = '/api/v2/feats';

/** Эндпоинт поиска видов. */
export const SPECIES_SEARCH_PATH = '/api/v2/species/search';

/** Эндпоинт поиска заклинаний. */
export const SPELLS_SEARCH_PATH = '/api/v2/spells/search';

/** Эндпоинт фильтров заклинаний — источник списка классов для чипов. */
export const SPELLS_FILTERS_PATH = '/api/v2/spells/filters';

/** Размер страницы каталога заклинаний (как в разделе «Заклинания»). */
export const SPELL_CATALOG_PAGE_SIZE = 60;

/** Группировка каталога: сервер отдаёт заклинания кругами по порядку. */
export const SPELL_CATALOG_GROUPING = 'LEVEL';

/** Сортировка каталога внутри круга — по русскому названию. */
export const SPELL_CATALOG_SORTING = 'NAME';

/** Дистанция до низа списка каталога для подгрузки следующей страницы. */
export const SPELL_CATALOG_LOAD_MORE_DISTANCE = 300;

/** Дебаунс поискового запроса каталога заклинаний. */
export const SPELL_CATALOG_SEARCH_DEBOUNCE_MS = 300;

/** Круги заклинаний для быстрого фильтра (0 — заговоры). */
export const SPELL_LEVELS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Базовый путь деталей вида (`/{url}` и `/{url}/lineages`). */
export const SPECIES_DETAIL_BASE_PATH = '/api/v2/species';

/** Эндпоинт поиска предметов (раздел «Предметы»). */
export const ITEMS_SEARCH_PATH = '/api/v2/item/search';

/** Эндпоинт фильтров предметов — источник списка категорий для чипов. */
export const ITEMS_FILTERS_PATH = '/api/v2/item/filters';

/** Базовый путь деталей предмета (`/{url}`). */
export const ITEMS_DETAIL_BASE_PATH = '/api/v2/item';

/** Эндпоинт поиска магических предметов (раздел «Магические предметы»). */
export const MAGIC_ITEMS_SEARCH_PATH = '/api/v2/magic-items/search';

/** Эндпоинт фильтров магических предметов. */
export const MAGIC_ITEMS_FILTERS_PATH = '/api/v2/magic-items/filters';

/** Порядок групп инвентаря по категориям предмета. */
export const INVENTORY_CATEGORY_ORDER: InventoryItemCategory[] = [
  'WEAPON',
  'ARMOR',
  'ITEM',
  'MAGIC_ITEM',
];

/** Названия групп инвентаря по категориям предмета. */
export const INVENTORY_CATEGORY_TITLES: Record<InventoryItemCategory, string> =
  {
    WEAPON: 'Оружие',
    ARMOR: 'Доспехи',
    ITEM: 'Прочее',
    MAGIC_ITEM: 'Магические предметы',
  };

/** Иконки предметов инвентаря по категориям. */
export const INVENTORY_CATEGORY_ICONS: Record<InventoryItemCategory, string> = {
  WEAPON: 'tabler:sword',
  ARMOR: 'tabler:shield',
  ITEM: 'tabler:backpack',
  MAGIC_ITEM: 'tabler:sparkles',
};

/** Максимальное количество одного предмета в инвентаре. */
export const INVENTORY_QUANTITY_MAX = 999;

/** Слова размеров для разбора строки размера вида. */
export const SIZE_LABEL_WORDS = [
  'Крошечный',
  'Маленький',
  'Средний',
  'Большой',
  'Огромный',
  'Громадный',
  'Исполинский',
];

/** Скорость ходьбы по умолчанию, если разбор строки скорости не удался. */
export const SPEED_PARSE_FALLBACK = 30;

/**
 * Дистанция тёмного зрения по умолчанию, если особенность найдена, но число в
 * тексте не распознано.
 */
export const DARKVISION_PARSE_FALLBACK = 60;

/** Подписи происхождения особенности персонажа. */
export const FEATURE_ORIGIN_LABELS: Record<FeatureOrigin, string> = {
  species: 'Вид',
  lineage: 'Подвид',
  class: 'Класс',
  feat: 'Черта',
  none: 'Нет',
};

/** Варианты происхождения при добавлении особенности вручную. */
export const FEATURE_ORIGIN_OPTIONS: Array<{
  label: string;
  value: FeatureOrigin;
}> = [
  { label: 'Нет', value: 'none' },
  { label: 'Вид', value: 'species' },
  { label: 'Класс', value: 'class' },
];

/** Каталог языков для настройки владения: группы и языки. */
export const LANGUAGE_PROFICIENCY_GROUPS: LanguageProficiencyGroup[] = [
  {
    key: 'standard',
    title: 'Стандартные',
    all: 'Все стандартные языки',
    items: [
      'Общий',
      'Дварфийский',
      'Эльфийский',
      'Гигантский',
      'Гномский',
      'Гоблинский',
      'Полуросликовский',
      'Оркский',
    ],
  },
  {
    key: 'rare',
    title: 'Редкие',
    all: 'Все редкие языки',
    items: [
      'Абиссальный',
      'Небесный',
      'Глубинная речь',
      'Драконий',
      'Инфернальный',
      'Первоязык',
      'Сильван',
      'Подземный',
    ],
  },
  {
    key: 'exotic',
    title: 'Экзотические',
    all: 'Все экзотические языки',
    items: ['Друидический', 'Язык воров'],
  },
];

/** Иконка колонки владения оружием. */
export const WEAPON_PROFICIENCY_ICON = 'tabler:circle-filled';

/** Иконка мастерства оружием. */
export const WEAPON_MASTERY_ICON = 'tabler:medal';

/** Классы цвета заголовков групп оружия в модалке владения. */
export const WEAPON_GROUP_TITLE_CLASSES: Record<
  WeaponProficiencyGroup['key'],
  string
> = {
  simple: 'text-warning',
  martial: 'text-error',
};

/** Подписи для незаполненных полей листа. */
export const SHEET_EMPTY_LABELS: Record<
  'species' | 'className' | 'background' | 'classResources' | 'proficiencies',
  string
> = {
  species: 'Вид не выбран',
  className: 'Класс не выбран',
  background: 'Предыстория не выбрана',
  classResources: 'Нет ресурсов',
  proficiencies: 'Нет',
};

/** Вкладки правой панели листа персонажа. */
export const SHEET_TABS: SheetTab[] = [
  { slot: 'equipment', label: 'Снаряжение' },
  { slot: 'spells', label: 'Заклинания' },
  { slot: 'features', label: 'Особенности' },
  { slot: 'effects', label: 'Эффекты' },
  { slot: 'notes', label: 'Заметки' },
];

/** Подписи пустых вкладок листа персонажа. */
export const SHEET_TAB_EMPTY_LABELS: Record<
  'equipment' | 'spells' | 'features' | 'effects' | 'notes',
  string
> = {
  equipment: 'Инвентарь пуст',
  spells: 'Книга заклинаний пуста',
  features: 'Нет особенностей',
  effects: 'Нет активных эффектов',
  notes: 'Нет заметок',
};
