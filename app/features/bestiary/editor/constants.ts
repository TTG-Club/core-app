import type { CreatureInventorySection, CreatureSaveEffect } from '../model';

export const CREATURE_IMAGE_SECTION_TITLE = 'Изображения';

/** Наименьшее количество позиции инвентаря: ноль предметов — это их отсутствие. */
export const MIN_CREATURE_INVENTORY_QUANTITY = 1;

/** Справочники, из которых берут позицию инвентаря. */
export const CREATURE_INVENTORY_SECTION_OPTIONS: Array<{
  label: string;
  value: CreatureInventorySection;
}> = [
  { label: 'Предмет', value: 'items' },
  { label: 'Магический предмет', value: 'magic-items' },
];

/** Подписи блока инвентаря существа. */
export const CREATURE_INVENTORY_EDITOR = {
  title: 'Инвентарь',
  section: 'Справочник',
  item: 'Предмет',
  quantity: 'Количество',
  quantityPlaceholder: '1',
  description: 'Уточнение',
  descriptionPlaceholder: 'Например: по выбору мастера',
  addItem: 'Добавить предмет',
  text: 'Строка инвентаря',
  textPlaceholder: 'Введи снаряжение строкой',
  textHelp:
    'Идёт рядом с предметами: количества словами и то, чему карточки на сайте нет.',
  legacy: 'Снаряжение (устаревшее)',
  legacyPlaceholder: 'Введи снаряжение',
  legacyHelp:
    'Поле старого импорта. Показывается на карточке, только пока не заполнены '
    + 'предметы и строка инвентаря.',
} as const;

export const CREATURE_GALLERY_FIELD_LABEL = 'Галерея';

export const CREATURE_UPLOAD_SECTION = 'bestiary';

/** Заголовки списков боевого блока. */
export const CREATURE_ACTION_LIST_TITLES = {
  traits: 'Особенности',
  actions: 'Действия',
  bonusActions: 'Бонусные действия',
  reactions: 'Реакции',
  legendary: 'Легендарные действия',
  lair: 'Эффекты логова',
} as const;

/** Вкладки формы существа — в порядке показа. */
export const CREATURE_EDITOR_TABS = {
  main: 'Основное',
  statblock: 'Статблок',
  inventory: CREATURE_INVENTORY_EDITOR.title,
  traits: CREATURE_ACTION_LIST_TITLES.traits,
  actions: 'Действия',
  effects: 'Эффекты',
  images: CREATURE_IMAGE_SECTION_TITLE,
} as const;

/** Подписи кнопки добавления — в единственном числе, как просит русская фраза. */
export const CREATURE_ACTION_ADD_LABELS = {
  traits: 'Добавить особенность',
  actions: 'Добавить действие',
  bonusActions: 'Добавить бонусное действие',
  reactions: 'Добавить реакцию',
  legendary: 'Добавить легендарное действие',
  lair: 'Добавить эффект логова',
} as const;

/** Разделы внутри записи боевого блока. */
export const CREATURE_ACTION_SECTIONS = {
  combat: 'Бой',
  combatHint:
    'Чем запись кидает броски на виртуальном столе. Не заполнено — VTTG '
    + 'разбирает описание текстом, как раньше.',
  effects: 'Эффекты записи',
  effectsHint:
    'Что запись накладывает при попадании или активации. По умолчанию эффект '
    + 'летит в цель, а не на само существо.',
} as const;

/** Подписи свёрнутой строки записи боевого блока. */
export const CREATURE_ACTION_ENTRY = {
  unnamed: 'Новая запись',
  combatBadge: 'Бой: ',
  effectsBadge: 'Эффекты: ',
  removeConfirmTitle: 'Удалить запись?',
  removeConfirmText:
    'Запись удалится из формы вместе с описанием, боевой механикой и '
    + 'эффектами. Пока существо не сохранено, изменение можно отменить, '
    + 'закрыв форму.',
  removeConfirmCancel: 'Оставить',
  removeConfirmApply: 'Удалить',
} as const;

/** Подписи полей записи боевого блока. */
export const CREATURE_ACTION_LABELS = {
  nameRus: 'Название',
  nameRusPlaceholder: 'Введи название',
  nameEng: 'Название (англ.)',
  nameEngPlaceholder: 'Введи английское название',
  description: 'Описание',
  descriptionPlaceholder: 'Введи описание',
  recharge: 'Перезарядка',
  attackType: 'Тип атаки',
  attackBonus: 'Бонус атаки',
  attackBonusPlaceholder: 'Например: 5',
  attackBonusHint: 'Плоское число: у существа он не выводится из характеристик',
  attackBonusReplaced: 'Спасбросок заменяет бросок попадания',
  reach: 'Досягаемость, фт',
  rangeNormal: 'Дистанция, фт',
  rangeLong: 'Максимальная дистанция, фт',
  distancePlaceholder: 'Например: 30',
  saveAbility: 'Спасбросок',
  saveAbilityPlaceholder: 'Выбери характеристику',
  saveDc: 'Сл спасброска',
  saveDcPlaceholder: 'Например: 13',
  saveEffect: 'При успехе',
  saveEffectPlaceholder: 'Выбери исход',
  areaType: 'Область воздействия',
  areaSize: 'Радиус или длина, фт',
  areaWidth: 'Ширина, фт',
  areaHeight: 'Высота, фт',
  remove: 'Удалить запись',
} as const;

/** Текст на месте пустого списка частей урона записи. */
export const CREATURE_DAMAGE_PART_EMPTY =
  'Урона нет. Добавь часть, если запись его наносит или лечит.';

/** Что происходит с уроном при успешном спасброске цели. */
export const CREATURE_SAVE_EFFECT_OPTIONS: Array<{
  label: string;
  value: CreatureSaveEffect;
}> = [
  { label: 'Половина урона', value: 'HALF' },
  { label: 'Урона нет', value: 'NONE' },
  { label: 'Особый случай', value: 'SPECIAL' },
];

/**
 * Токены формул, запрещённые существу: модификатор характеристики, бонус
 * мастерства и уровень. У существа они уже вшиты в плоское число, а VTTG
 * прочитал бы их единицей — молча и не тем числом.
 */
export const CREATURE_FORMULA_FORBIDDEN_TOKENS =
  /@(?:mod\.|prof|(?:class)?level)/i;

/** Ошибка формулы с запрещённым токеном. */
export const CREATURE_FORMULA_ERROR =
  'У существа модификатор уже вшит в число: убери @mod, @prof и @level из формулы.';
