import type {
  AbilityKey,
  CurrencyKey,
  RollMode,
  SheetTab,
  SkillProficiencyLevel,
  SpeedTypeKey,
  SpeedUnit,
  VisionKey,
} from './types';

/** Название инструмента «Лист персонажа». */
export const CHARACTER_SHEET_TITLE = 'Лист персонажа';

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

/** Подписи для незаполненных полей листа. */
export const SHEET_EMPTY_LABELS: Record<
  'species' | 'background' | 'classResources' | 'proficiencies' | 'inventory',
  string
> = {
  species: 'Вид не выбран',
  background: 'Предыстория не выбрана',
  classResources: 'Нет ресурсов',
  proficiencies: 'Нет',
  inventory: 'Пусто',
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
  'spells' | 'features' | 'effects' | 'notes',
  string
> = {
  spells: 'Книга заклинаний пуста',
  features: 'Нет особенностей',
  effects: 'Нет активных эффектов',
  notes: 'Нет заметок',
};
