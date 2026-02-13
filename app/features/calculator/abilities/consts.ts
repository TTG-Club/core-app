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

export const API_URLS = {
  CLASSES_ABILITY_IMPROVEMENT: '/api/v2/classes/ability-improvement',
};
