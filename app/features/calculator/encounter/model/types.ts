/** Строка группы: несколько персонажей одного уровня. */
export interface EncounterPartyRow {
  /** Локальный идентификатор строки (ключ списка). */
  id: string;

  /** Уровень персонажей строки, от 1 до 20. */
  level: number;

  /** Сколько персонажей этого уровня в группе. */
  count: number;
}

/**
 * Существо столкновения: из бестиария или свой монстр мастера (без ссылки на
 * бестиарий, только название и показатель опасности).
 */
export interface EncounterCreature {
  /** Локальный идентификатор строки (ключ списка). */
  id: string;

  /** URL существа в бестиарии; нет — свой монстр мастера. */
  url?: string;

  /** Русское название существа. */
  name: string;

  /** Уровень опасности строкой («1/4», «5»). */
  challengeRating: string;

  /** Опыт за одно существо. */
  experience: number;

  /** Опыт за одно существо в его логове; нет — логова у существа нет. */
  experienceInLair?: number;

  /** Сражается ли существо в своём логове. */
  inLair: boolean;

  /** Сколько таких существ в столкновении. */
  count: number;
}

/** Что мастер ввёл о своём монстре. */
export interface CustomCreatureDraft {
  /** Название; пусто — название по умолчанию. */
  name: string;

  /** Показатель опасности строкой («1/4», «5»). */
  challengeRating: string;

  /** Сколько таких монстров добавить. */
  count: number;
}

/** Пункт выбора показателя опасности. */
export interface ChallengeRatingItem {
  value: string;
  label: string;
}

/** Состояние калькулятора, которое переживает перезагрузку страницы. */
export interface EncounterState {
  party: Array<EncounterPartyRow>;
  creatures: Array<EncounterCreature>;
}

/** Бюджет опыта на одного персонажа или на всю группу (DMG 2024). */
export interface EncounterBudget {
  low: number;
  moderate: number;
  high: number;
}

/**
 * Сложность столкновения по тому, сколько бюджета потрачено:
 * - `none` — группы или существ нет, считать нечего;
 * - `low` / `moderate` / `high` — опыт укладывается в соответствующий бюджет;
 * - `beyond` — опыт превышает бюджет высокой сложности.
 */
export type EncounterDifficulty =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'beyond';

/** Итог расчёта столкновения. */
export interface EncounterResult {
  /** Бюджет всей группы. */
  budget: EncounterBudget;

  /** Суммарный опыт существ столкновения. */
  totalExperience: number;

  /** Число персонажей в группе. */
  characterCount: number;

  /** Опыт на одного персонажа (с округлением вниз). */
  experiencePerCharacter: number;

  difficulty: EncounterDifficulty;
}

/** Отрезок шкалы бюджета: одна из трёх зон сложности. */
export interface EncounterBudgetSegment {
  difficulty: Exclude<EncounterDifficulty, 'none' | 'beyond'>;

  /** Доля всей шкалы, которую занимает зона, от 0 до 1. */
  width: number;

  /** Насколько зона заполнена потраченным опытом, от 0 до 1. */
  fill: number;
}

/** Сложность, до которой добирает генератор. */
export type GenerationDifficulty = Exclude<
  EncounterDifficulty,
  'none' | 'beyond'
>;

/** Диапазон опыта, который генератор должен добавить, включительно. */
export interface GenerationWindow {
  min: number;
  max: number;
}

/** Существо-кандидат генератора с известным опытом. */
export interface GenerationCandidate {
  url: string;
  label: string;
  challengeRating: string;
  experience: number;
  experienceInLair?: number;

  /** Коды типов существа (`HUMANOID`, `UNDEAD`). */
  typeCodes: Array<string>;

  /** Уточнение типа в нижнем регистре (`гоблиноид`); пусто — нет. */
  subtype: string;

  /** Семейство — секция бестиария в нижнем регистре (`гоблины`); пусто — нет. */
  family: string;

  /** Мировоззрение кодом (`CHAOTIC_EVIL`); пусто — неизвестно. */
  alignment: string;

  /** Слаги спутников — существ, с которыми это обычно встречается. */
  companions: Array<string>;
}

/** Одно существо в результате генерации и сколько его добавить. */
export interface GeneratedCreature {
  candidate: GenerationCandidate;
  count: number;
}

/** Пачка одинаковых существ для переноса в трекер инициативы. */
export interface EncounterTransferBatch {
  /** URL существа в бестиарии. */
  creatureUrl: string;

  /** Сколько таких существ перенести. */
  count: number;
}

/** Трекер инициативы, в который можно перенести существ. */
export interface EncounterTransferTracker {
  id: string;
  name: string;

  /** Идёт ли в трекере бой: новым существам бэкенд сразу бросит инициативу. */
  isActive: boolean;
}

/** Источник случайных чисел в диапазоне [0, 1) — подменяется в тестах. */
export type RandomSource = () => number;

/** Кандидат в свиту и его вес при случайном выборе. */
export interface RetinueOption {
  candidate: GenerationCandidate;
  weight: number;
}

/** Промежуточный итог одной попытки генерации. */
export interface GenerationAttempt {
  picks: Array<GeneratedCreature>;
  total: number;

  /** Свита подобрана по совместимости, а не наугад. */
  isThemed: boolean;
}
