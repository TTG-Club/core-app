/** Строка группы: несколько персонажей одного уровня. */
export interface EncounterPartyRow {
  /** Локальный идентификатор строки (ключ списка). */
  id: string;

  /** Уровень персонажей строки, от 1 до 20. */
  level: number;

  /** Сколько персонажей этого уровня в группе. */
  count: number;
}

/** Существо столкновения, взятое из бестиария. */
export interface EncounterCreature {
  /** Локальный идентификатор строки (ключ списка). */
  id: string;

  /** URL существа в бестиарии. */
  url: string;

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
