export const SPECIES_INNATE_SPELL_EDITOR = {
  title: 'Врождённые заклинания',
  description:
    'Эти заговоры и заклинания всегда доступны персонажу. Уровень определяет, когда заклинание появится в листе.',
  characterLevelLabel: 'Уровень персонажа',
  /** Подпись уровня в строке: рядом с полем длинная не помещается */
  characterLevelShort: 'С уровня',
  minimumCharacterLevel: 1,
  maximumCharacterLevel: 20,
  defaultCharacterLevel: 1,
};

/** Вкладки формы вида — в порядке показа. */
export const SPECIES_EDITOR_TABS = {
  main: 'Основное',
  properties: 'Характеристики',
  features: 'Умения',
  grants: 'Дары',
  spells: 'Заклинания',
  effects: 'Эффекты',
  images: 'Изображения',
} as const;

/** Подписи полей формы вида. */
export const SPECIES_EDITOR_LABELS = {
  descriptionTitle: 'Описание',
  description: 'Описание',
  descriptionPlaceholder: 'Введи описание',
  parent: 'Основной вид',
  parentHint: 'Необходимо указать, если создаешь происхождение вида',
  creatureType: 'Тип',

  darkVision: 'Тёмное зрение',
  darkVisionHint:
    'Дальность в футах. Пусто — вида тёмного зрения не имеет. Чувства, которые даёт отдельное умение, задаются в дарах этого умения.',
  darkVisionStep: 30,
  darkVisionMax: 300,

  grantsTitle: 'Дары вида',
  grantsHint:
    'То, что даёт выбор вида целиком: владения, языки, защиты. Нужно прежде всего происхождениям — умений у них нет, и приписать дар больше некуда. Если дар даёт конкретное умение, задай его у самого умения.',
  modifiersTitle: 'Постоянные правки листа',

  featureLevel: 'Уровень',
  featureLevelHint:
    'Уровень персонажа, с которого умение действует. Пусто или 1 — с первого.',
  featureGrantsTitle: 'Дары умения',
  featureModifiersTitle: 'Правки листа от умения',
  featureEffectsTitle: 'Эффекты умения',
  featureAdvanced: 'Механика и эффекты',

  effectsHint:
    'Активные эффекты вида в вокабуляре виртуального стола: бонусы, флаги, иммунитеты. Дары лист проставляет сам, а эффект меняет числа готовой формулой.',
} as const;

/** Границы уровня умения вида. */
export const SPECIES_FEATURE_LEVEL = {
  min: 1,
  max: 20,
} as const;

/** Подписи статблока вида на странице. */
export const SPECIES_STATS_LABELS = {
  darkVision: 'Тёмное зрение:',
  markdownDarkVision: 'Тёмное зрение',
  feet: 'фт.',
} as const;
