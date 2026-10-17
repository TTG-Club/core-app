import type {
  FacilityChoiceForm,
  FacilityChoiceOptionForm,
  FacilityChoiceSource,
  FacilityEnlargementForm,
  FacilityFeatureForm,
  FacilityOrderOptionForm,
  FacilitySpaceCode,
} from './types';

export const BASTION_SECTION = 'bastions';
export const BASTION_API_PATH = '/api/v2/bastions';
export const BASTION_RULES_API_PATH = `${BASTION_API_PATH}/rules`;
export const BASTION_WORKSHOP_PATH = `/workshop/${BASTION_SECTION}`;

export const BASTION_SEO = {
  title: 'Бастионы [Bastions] — D&D 5 (2024)',
  description: 'Сооружения бастиона из D&D 5 (редакция 2024 года).',
  titleTemplate: '%s | Бастионы D&D 5 2024',
} as const;

/** Подпись группы списка без уровня — у базовых сооружений уровня нет. */
export const BASTION_BASIC_GROUP_LABEL = 'Базовые сооружения';

export const BASTION_BODY_LABELS = {
  levelSubtitle: 'Уровень {level}, сооружение бастиона',
  basicSubtitle: 'Базовое сооружение бастиона',
  defaultSubtitle: 'Сооружение бастиона',
  category: 'Вид',
  level: 'Уровень',
  prerequisite: 'Требование',
  space: 'Пространство',
  basicSpace: 'Тесное или вместительное, на выбор игрока',
  hirelings: 'Наёмники',
  orders: 'Приказ',
  repeatable: 'Можно иметь несколько',
  yes: 'Да',
  noPrerequisite: 'Нет',
  squares: 'кв.',
  orderOptionsTitle: 'Приказы',
  featuresTitle: 'Свойства',
  choicesTitle: 'Выборы',
  enlargementTitle: 'Расширение',
  days: 'дн.',
  gold: 'зм',
  free: 'бесплатно',
  fromLevel: 'с {level} уровня',
  choiceCount: 'выбирается: {count}',
  enlargedChoiceCount: 'после расширения: {count}',
  additionalHirelings: 'наёмников: +{count}',
} as const;

export const BASTION_EDITOR_LABELS = {
  detailsTitle: 'Подробная информация',
  descriptionTitle: 'Описание',
  ordersTitle: 'Приказы',
  featuresTitle: 'Свойства',
  choicesTitle: 'Выборы',
  enlargementTitle: 'Расширение',
  category: 'Вид сооружения',
  level: 'Уровень',
  levelHelp: 'У базовых сооружений уровня нет',
  prerequisite: 'Требование',
  space: 'Пространство',
  spaceRequired: 'Выберите пространство',
  hirelings: 'Наёмники',
  repeatable: 'Можно иметь несколько',
  repeatableCheckbox: 'В бастионе может быть больше одного такого сооружения',
  barrack: 'Барак',
  barrackCheckbox:
    'Размещает защитников: 12 во вместительном, 24 в просторном; «Завербовать» '
    + 'бесплатно нанимает 4',
  menagerie: 'Зверинец',
  menagerieCheckbox:
    'Вольеры на 4 больших существа; «Завербовать» нанимает существо из таблицы '
    + 'за 7 дней, существа — защитники бастиона',
  stable: 'Конюшня',
  stableCheckbox:
    'Животные на 3 больших места, при появлении — ездовая лошадь и 2 пони; '
    + '«Торговать» покупает или продаёт животное за 7 дней',
  orders: 'Принимаемые приказы',
  ordersHelp: '«Обслуживать» отдаётся всему бастиону и здесь не выбирается',
  description: 'Описание',
  descriptionPlaceholder: 'Введи описание',
  orderOptionsHint:
    'Что именно можно заказать по приказу: срок, цена и минимальный уровень. Эти числа прочитает мини-игра',
  orderOptionsEmpty: 'Вариантов приказов нет',
  addOrderOption: 'Добавить вариант',
  order: 'Приказ',
  optionName: 'Название',
  optionNamePlaceholder: 'книгу',
  days: 'Дней',
  cost: 'Цена, зм',
  costNote: 'Правило цены',
  costNotePlaceholder: '100 зм + 100 зм за каждого защитника',
  minLevel: 'С уровня',
  optionDescription: 'Описание',
  featuresHint: 'Постоянные свойства: чары, вдохновение, восстановление ячейки',
  featuresEmpty: 'Свойств нет',
  addFeature: 'Добавить свойство',
  featureName: 'Название',
  featureDescription: 'Описание',
  choicesHint:
    'Что игрок выбирает для своего сооружения: тип сада, мастера, гильдию',
  choicesEmpty: 'Выборов нет',
  addChoice: 'Добавить выбор',
  choiceName: 'Название',
  choiceNamePlaceholder: 'Тип сада',
  choiceCount: 'Сколько выбрать',
  choiceEnlargedCount: 'После расширения',
  choiceDescription: 'Пояснение',
  choiceOptions: 'Варианты',
  addChoiceOption: 'Добавить вариант',
  choiceOptionName: 'Вариант',
  choiceOptionDescription: 'Описание',
  choiceSource: 'Откуда варианты',
  choiceSourceUnset: 'Перечислить вручную',
  choiceSourceHint:
    'Варианты подставляются из справочника, вместе с тем, что ими можно '
    + 'создать. Список создаваемых предметов задаётся в редакторе предмета.',
  enlargementEnabled: 'Сооружение можно расширить',
  enlargementSpace: 'Пространство после расширения',
  enlargementCost: 'Цена, зм',
  enlargementDays: 'Дней',
  enlargementHirelings: 'Доп. наёмники',
  enlargementDescription: 'Что даёт расширение',
  roomTemplateTitle: 'Комната на плане бастиона',
  roomTemplateHint:
    'Какой комнатой сооружение встаёт на план, когда его вытягивают из '
    + 'закладки «Сооружения»: размер и расстановка мебели для каждого '
    + 'пространства.',
  roomTemplateNoSpaces:
    'Выберите пространство сооружения, чтобы настроить его комнату',
  roomTemplateAuto:
    'Мебель расставляется автоматически по виду сооружения. Настройте '
    + 'шаблон, чтобы задать размер комнаты и расстановку самому.',
  roomTemplateCustomize: 'Настроить',
  roomTemplateReset: 'Сбросить к автоматической',
  roomTemplateSize: 'Размер комнаты',
  remove: 'Удалить',
} as const;

export const BASTION_WORKSHOP_LABELS = {
  section: 'Бастионы',
  listTitle: 'Мастерская сооружений бастиона',
  create: 'Создать сооружение',
  createTitle: 'Создание сооружения бастиона',
  editTitle: 'Редактирование сооружения бастиона',
  back: 'Вернуться в мастерскую',
  close: 'Закрыть',
} as const;

export const EMPTY_ORDER_OPTION: FacilityOrderOptionForm = {
  name: '',
  description: '',
  days: null,
  cost: null,
  costNote: '',
  minLevel: null,
};

export const EMPTY_FEATURE: FacilityFeatureForm = {
  name: '',
  description: '',
};

export const EMPTY_CHOICE_OPTION: FacilityChoiceOptionForm = {
  name: '',
  description: '',
};

export const EMPTY_CHOICE: FacilityChoiceForm = {
  name: '',
  description: '',
  count: 1,
  enlargedCount: null,
  options: [],
};

/** Источники вариантов выбора сооружения. */
export const FACILITY_CHOICE_SOURCE_OPTIONS: Array<{
  label: string;
  value: FacilityChoiceSource;
}> = [{ label: 'Инструменты ремесленников', value: 'ARTISAN_TOOLS' }];

/** Пространства сооружения от меньшего к большему. */
export const FACILITY_SPACE_ORDER: ReadonlyArray<FacilitySpaceCode> = [
  'CRAMPED',
  'ROOMY',
  'VAST',
];

export const EMPTY_ENLARGEMENT: FacilityEnlargementForm = {
  cost: null,
  days: null,
  additionalHirelings: null,
  description: '',
};
