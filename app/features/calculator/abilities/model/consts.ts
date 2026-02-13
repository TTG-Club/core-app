import { AbilityKey } from '~/shared/types';

import type { AbilityScores } from './types';

export const DEFAULT_SCORES: AbilityScores = {
  [AbilityKey.STRENGTH]: 8,
  [AbilityKey.DEXTERITY]: 8,
  [AbilityKey.CONSTITUTION]: 8,
  [AbilityKey.INTELLIGENCE]: 8,
  [AbilityKey.WISDOM]: 8,
  [AbilityKey.CHARISMA]: 8,
};

export const ZERO_SCORES: AbilityScores = {
  [AbilityKey.STRENGTH]: 0,
  [AbilityKey.DEXTERITY]: 0,
  [AbilityKey.CONSTITUTION]: 0,
  [AbilityKey.INTELLIGENCE]: 0,
  [AbilityKey.WISDOM]: 0,
  [AbilityKey.CHARISMA]: 0,
};

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN_SCORE = 8;
export const POINT_BUY_MAX_SCORE = 15;

/** Максимальное значение характеристики без превышения лимита */
export const ABILITY_MAX_SCORE = 20;

/** Стандартные уровни получения ASI для большинства классов */
export const STANDARD_ASI_LEVELS = [4, 8, 12, 16];

/** Уровень получения эпического дара */
export const EPIC_BOON_LEVEL = 19;

/** Увеличение максимального значения характеристики от эпического дара */
export const EPIC_BOON_MAX_SCORE_INCREASE = 10;

/** Количество бросков для случайного набора */
export const RANDOM_ROLL_COUNT = 6;

/** Формула броска для случайного набора */
export const RANDOM_ROLL_FORMULA = '4d6dl1';

/** Максимальный результат броска 4d6dl1 (три шестёрки) */
export const RANDOM_ROLL_MAX_RESULT = 18;

export enum TabValues {
  Random = 'random',
  StandardArray = 'standard-array',
  PointBuy = 'point-buy',
}

export const ABILITIES_TABS = [
  {
    label: 'Случайный набор',
    value: TabValues.Random,
    slot: TabValues.Random,
  },
  {
    label: 'Стандартный набор',
    value: TabValues.StandardArray,
    slot: TabValues.StandardArray,
  },
  {
    label: 'Покупка значений',
    value: TabValues.PointBuy,
    slot: TabValues.PointBuy,
  },
];

export const STANDARD_ARRAY_LABELS = {
  NOT_SELECTED: 'Не выбрано',
  USED_SUFFIX: '(Занято)',
  APPLY_TEMPLATE: 'Использовать шаблон класса',
  DESCRIPTION_PREFIX: 'Распределите значения:',
};
