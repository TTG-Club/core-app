import type {
  EncounterBudget,
  EncounterDifficulty,
  EncounterState,
  GenerationDifficulty,
} from './types';

/** Префикс страницы существа в бестиарии. */
export const BESTIARY_PAGE_PREFIX = '/bestiary/';

/** Ключ состояния калькулятора в localStorage. */
export const ENCOUNTER_STORAGE_KEY = 'calculator:encounter';

export const MIN_CHARACTER_LEVEL = 1;
export const MAX_CHARACTER_LEVEL = 20;

/** Сколько персонажей одного уровня можно задать одной строкой. */
export const MIN_ROW_COUNT = 1;
export const MAX_ROW_COUNT = 20;

/** Сколько строк группы и существ можно добавить. */
export const MAX_PARTY_ROWS = 20;
export const MAX_CREATURE_ROWS = 50;

/** Уровень персонажей в новой строке группы. */
export const DEFAULT_CHARACTER_LEVEL = 1;

/** Сколько персонажей в группе по умолчанию — типичная партия. */
export const DEFAULT_PARTY_SIZE = 4;

/** Начальное состояние: группа из четырёх персонажей 1 уровня, существ нет. */
export const DEFAULT_ENCOUNTER_STATE: EncounterState = {
  party: [
    {
      id: 'default',
      level: DEFAULT_CHARACTER_LEVEL,
      count: DEFAULT_PARTY_SIZE,
    },
  ],
  creatures: [],
};

/**
 * Бюджет опыта на одного персонажа по его уровню — таблица «XP Budget per
 * Character» из DMG 2024. Индекс массива — уровень минус один.
 */
export const EXPERIENCE_BUDGET_BY_LEVEL: ReadonlyArray<EncounterBudget> = [
  { low: 50, moderate: 75, high: 100 },
  { low: 100, moderate: 150, high: 200 },
  { low: 150, moderate: 225, high: 400 },
  { low: 250, moderate: 375, high: 500 },
  { low: 500, moderate: 750, high: 1_100 },
  { low: 600, moderate: 1_000, high: 1_400 },
  { low: 750, moderate: 1_300, high: 1_700 },
  { low: 1_000, moderate: 1_700, high: 2_100 },
  { low: 1_300, moderate: 2_000, high: 2_600 },
  { low: 1_600, moderate: 2_300, high: 3_100 },
  { low: 1_900, moderate: 2_900, high: 4_100 },
  { low: 2_200, moderate: 3_700, high: 4_700 },
  { low: 2_600, moderate: 4_200, high: 5_400 },
  { low: 2_900, moderate: 4_900, high: 6_200 },
  { low: 3_300, moderate: 5_400, high: 7_800 },
  { low: 3_800, moderate: 6_100, high: 9_800 },
  { low: 4_500, moderate: 7_200, high: 11_700 },
  { low: 5_000, moderate: 8_700, high: 14_200 },
  { low: 5_500, moderate: 10_700, high: 17_200 },
  { low: 6_400, moderate: 13_200, high: 22_000 },
];

/**
 * Опыт по уровню опасности. Нужен, когда поиск бестиария не прислал опыт
 * существа явно, — тогда берём его по уровню опасности.
 */
export const EXPERIENCE_BY_CHALLENGE_RATING: Readonly<Record<string, number>> =
  {
    '0': 10,
    '1/8': 25,
    '1/4': 50,
    '1/2': 100,
    '1': 200,
    '2': 450,
    '3': 700,
    '4': 1_100,
    '5': 1_800,
    '6': 2_300,
    '7': 2_900,
    '8': 3_900,
    '9': 5_000,
    '10': 5_900,
    '11': 7_200,
    '12': 8_400,
    '13': 10_000,
    '14': 11_500,
    '15': 13_000,
    '16': 15_000,
    '17': 18_000,
    '18': 20_000,
    '19': 22_000,
    '20': 25_000,
    '21': 33_000,
    '22': 41_000,
    '23': 50_000,
    '24': 62_000,
    '25': 75_000,
    '26': 90_000,
    '27': 105_000,
    '28': 120_000,
    '29': 135_000,
    '30': 155_000,
  };

/** Подпись сложности столкновения. */
export const DIFFICULTY_LABEL: Readonly<Record<EncounterDifficulty, string>> = {
  none: 'Нет данных',
  low: 'Низкая',
  moderate: 'Умеренная',
  high: 'Высокая',
  beyond: 'Выше высокой',
};

/** Пояснение к сложности — что ждёт группу. */
export const DIFFICULTY_HINT: Readonly<Record<EncounterDifficulty, string>> = {
  none: 'Добавьте персонажей и существ, чтобы оценить столкновение.',
  low: 'Персонажи справятся, потратив немного ресурсов; кто-то может упасть без сознания.',
  moderate:
    'Без отдыха и лечения бой может обернуться плохо для ослабленных персонажей.',
  high: 'Смертельно опасный бой: персонажам понадобятся тактика, удача и ресурсы.',
  beyond:
    'Опыт существ превышает бюджет высокой сложности — велик риск гибели группы.',
};

/** Цвет бейджа сложности (палитра Nuxt UI). */
export const DIFFICULTY_COLOR = {
  none: 'neutral',
  low: 'success',
  moderate: 'warning',
  high: 'error',
  beyond: 'error',
} as const satisfies Readonly<Record<EncounterDifficulty, string>>;

/** Классы зон шкалы бюджета: подложка и заполнение. */
export const SEGMENT_CLASSES = {
  low: { track: 'bg-success/15', fill: 'bg-success' },
  moderate: { track: 'bg-warning/15', fill: 'bg-warning' },
  high: { track: 'bg-error/15', fill: 'bg-error' },
} as const;

/** Сложность, которую генератор берёт по умолчанию. */
export const DEFAULT_GENERATION_DIFFICULTY: GenerationDifficulty = 'moderate';

/** Сложности, до которых умеет добирать генератор. */
export const GENERATION_DIFFICULTY_OPTIONS: Array<{
  value: GenerationDifficulty;
  label: string;
}> = [
  { value: 'low', label: 'Низкая' },
  { value: 'moderate', label: 'Умеренная' },
  { value: 'high', label: 'Высокая' },
];

/**
 * Нижняя граница низкой сложности для генератора — доля бюджета низкой
 * сложности: бой на пару десятков опыта генерировать бессмысленно.
 */
export const GENERATION_LOW_FLOOR_RATIO = 0.5;

/** Сколько попыток собрать столкновение делает генератор. */
export const GENERATION_ATTEMPTS = 40;

/** Шанс остановиться, когда опыт уже попал в нужную сложность. */
export const GENERATION_STOP_CHANCE = 0.35;

/** Шанс добавить ещё одну копию уже выбранного существа, а не новое. */
export const GENERATION_REPEAT_CHANCE = 0.6;

/** Сколько разных существ генератор кладёт в одно столкновение. */
export const GENERATION_MAX_KINDS = 3;

/** Доля бюджета, от которой существо годится в «главари» столкновения. */
export const GENERATION_LEADER_RATIO = 0.25;

/** Сколько существ генератор добавляет на одного персонажа (и сверху). */
export const GENERATION_CREATURES_PER_CHARACTER = 2;
export const GENERATION_MIN_CREATURES = 4;
export const GENERATION_MAX_CREATURES = 12;

/** Среда обитания, подходящая для любой местности. */
export const HABITAT_ANY = 'ANY';

/** Тексты уведомлений генератора. */
export const GENERATION_BUDGET_SPENT_TITLE = 'Бюджет сложности уже потрачен';
export const GENERATION_BUDGET_SPENT_DESCRIPTION =
  'Опыт добавленных существ уже достиг выбранной сложности. Очистите список или выберите сложность выше.';
export const GENERATION_NOT_FOUND_TITLE = 'Подходящих существ не нашлось';
export const GENERATION_NOT_FOUND_DESCRIPTION =
  'Попробуйте другую среду обитания или сложность.';
export const GENERATION_ERROR_TITLE = 'Не удалось сгенерировать столкновение';
export const GENERATION_ERROR_DESCRIPTION =
  'Бестиарий не ответил. Попробуйте ещё раз.';
