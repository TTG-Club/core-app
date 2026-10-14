import type {
  FacilityChoiceForm,
  FacilityChoiceOptionForm,
  FacilityEnlargementForm,
  FacilityFeatureForm,
  FacilityOrderOptionForm,
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
  hirelings: 'Наёмники',
  repeatable: 'Можно иметь несколько',
  repeatableCheckbox: 'В бастионе может быть больше одного такого сооружения',
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
  enlargementEnabled: 'Сооружение можно расширить',
  enlargementSpace: 'Пространство после расширения',
  enlargementCost: 'Цена, зм',
  enlargementDays: 'Дней',
  enlargementHirelings: 'Доп. наёмники',
  enlargementDescription: 'Что даёт расширение',
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

export const EMPTY_ENLARGEMENT: FacilityEnlargementForm = {
  cost: null,
  days: null,
  additionalHirelings: null,
  description: '',
};
