/**
 * Подписи заклинаний умения.
 *
 * Заклинания задаются у того умения, которое их даёт, — как и в системе D&D.
 * Название сохранилось от прежней вкладки: им же подписано умение, которое
 * форма заводит под заклинания вида, доставшиеся от старого хранения.
 */
export const SPECIES_INNATE_SPELL_EDITOR = {
  title: 'Врождённые заклинания',
  description:
    'Заговоры и заклинания, которые даёт это умение. По умолчанию приходят вместе с ним; уровень в строке нужен, только если заклинание открывается позже самого умения.',
  characterLevelLabel: 'Уровень персонажа',
  /** Подпись уровня в строке: рядом с полем длинная не помещается */
  characterLevelShort: 'С уровня',
  /** Пусто — заклинание приходит вместе с умением */
  characterLevelPlaceholder: 'С умения',
  minimumCharacterLevel: 1,
  maximumCharacterLevel: 20,
};

/** Вкладки формы вида — в порядке показа. */
export const SPECIES_EDITOR_TABS = {
  main: 'Основное',
  properties: 'Характеристики',
  features: 'Особенности',
  grants: 'Дары',
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
  featureSpellsTitle: 'Заклинания умения',
  featureAdvanced: 'Механика, заклинания и эффекты',

  effectsHint:
    'Активные эффекты вида в вокабуляре виртуального стола: бонусы, флаги, иммунитеты. Дары лист проставляет сам, а эффект меняет числа готовой формулой.',
} as const;

/** Подписи списка особенностей вида. */
export const SPECIES_FEATURES_EDITOR = {
  unnamed: 'Новая особенность',
  add: 'Добавить особенность',
  empty: 'У вида пока нет особенностей',
  nameLabel: 'Название',
  namePlaceholder: 'Введи название',
  nameEngLabel: 'Название (англ.)',
  nameEngPlaceholder: 'Введи английское название',
  descriptionLabel: 'Описание',
  descriptionPlaceholder: 'Введи описание',
  addDescription: 'Добавить описание',
  mechanicsBadge: 'Механика',
  collapse: 'Свернуть особенность',
  expand: 'Развернуть особенность',
  remove: 'Убрать особенность',
  removeConfirmTitle: 'Убрать особенность?',
  removeConfirmText:
    'Особенность удалится из формы вместе со своей механикой, заклинаниями и эффектами. Пока запись не сохранена, изменение можно отменить, закрыв форму.',
  removeConfirmCancel: 'Оставить',
  removeConfirmApply: 'Убрать',
} as const;

/** Подписи редактора размеров вида. */
export const SPECIES_SIZES_EDITOR = {
  size: 'Размер',
  heightFrom: 'Высота от',
  heightFromPlaceholder: 'Введи минимальную высоту',
  heightTo: 'Высота до',
  heightToPlaceholder: 'Введи максимальную высоту',
  feet: 'фт.',
  add: 'Добавить размер',
  empty: 'Размеры не указаны',
  remove: 'Убрать размер',
} as const;

/** Подписи и настройки редактора скоростей вида. */
export const SPECIES_SPEED_EDITOR = {
  base: 'Скорость передвижения',
  basePlaceholder: 'Введи скорость передвижения',
  labels: {
    fly: 'Скорость полета',
    climb: 'Скорость лазания',
    swim: 'Скорость плавания',
  },
  hover: 'Парит',
  add: 'Добавить скорость',
  remove: 'Убрать скорость',
  /** Значение только что добавленной строки — как базовая скорость по умолчанию. */
  defaultValue: 30,
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
