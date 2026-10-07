import type {
  CreatureActionListKey,
  CreatureDamageCondition,
  CreatureInventorySection,
  CreatureSaveEffect,
  CreatureSpellRestKind,
} from '../model';

import {
  CREATURE_DAMAGE_CONDITION_LABELS,
  CREATURE_DAMAGE_CONDITIONS,
  SpeedType,
} from '../model';

export const CREATURE_IMAGE_SECTION_TITLE = 'Изображения';

/** Виды скорости существа в порядке статблока: ходьба первой. */
export const CREATURE_SPEED_TYPES: Array<SpeedType> = Object.values(SpeedType);

/** Виды скорости существа: подписи строк списка и кнопок добавления. */
export const CREATURE_SPEED_TYPE_LABELS: Record<SpeedType, string> = {
  [SpeedType.WALK]: 'Ходьба',
  [SpeedType.FLY]: 'Полёт',
  [SpeedType.SWIM]: 'Плавание',
  [SpeedType.CLIMB]: 'Лазание',
  [SpeedType.BURROW]: 'Копание',
};

/** Подписи и значки блока скоростей существа. */
export const CREATURE_SPEED_EDITOR = {
  title: 'Скорость',
  unit: 'фт.',
  hover: 'Парит',
  text: 'Пояснение к скорости',
  textPlaceholder: 'Пояснение, например: только в форме медведя',
  add: 'Добавить скорость:',
  addIcon: 'tabler:plus',
  empty: 'Скоростей нет. Добавь нужные кнопками ниже.',
  remove: 'Удалить скорость',
  removeIcon: 'tabler:trash',
  clear: 'Очистить скорость',
  clearIcon: 'tabler:eraser',
} as const;

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
  descriptionPlaceholder: 'Например: из золота',
  descriptionHelp:
    'Приписка к предмету: показывается в скобках после названия — «Меч (из '
    + 'золота)».',
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

/**
 * Заголовки списков боевого блока. Ключи — те же, что у мест эффектов
 * `CREATURE_ACTION_EFFECT_CONTEXTS` в модели.
 */
export const CREATURE_ACTION_LIST_TITLES = {
  traits: 'Особенности',
  actions: 'Действия',
  bonusActions: 'Бонусные действия',
  reactions: 'Реакции',
  legendary: 'Легендарные действия',
  lair: 'Эффекты логова',
} as const satisfies Record<CreatureActionListKey, string>;

/** Подписи блока заклинаний существа. */
export const CREATURE_SPELLCASTING_EDITOR = {
  title: 'Заклинания',
  hint:
    'Блоки заводятся руками и на карточку сайта не выводятся: они уезжают на '
    + 'виртуальный стол, где у существа своя вкладка заклинаний.',
  addBlock: 'Добавить блок',
  empty:
    'Блоков нет. Блок — это один набор заклинаний с общей заклинательной '
    + 'характеристикой и Сл.',
  unnamed: 'Новый блок',
  groupsBadgeIcon: 'tabler:list-details',
  groupsBadgeTitle: 'Групп в блоке',
  spellsBadgeIcon: 'tabler:sparkles',
  spellsBadgeTitle: 'Заклинаний в блоке',
  removeBlock: 'Удалить блок',
  removeConfirmTitle: 'Удалить блок заклинаний?',
  removeConfirmText:
    'Блок удалится вместе с группами и списками заклинаний. Пока существо не '
    + 'сохранено, изменение можно отменить, закрыв форму.',
  removeConfirmCancel: 'Оставить',
  removeConfirmApply: 'Удалить',
  name: 'Название блока',
  namePlaceholder: 'Например: Использование заклинаний',
  ability: 'Заклинательная характеристика',
  abilityPlaceholder: 'Выбери характеристику',
  saveDc: 'Сл спасброска',
  saveDcPlaceholder: '13',
  saveDcHint:
    'Плоское число: у существа Сл не выводится из характеристики и бонуса '
    + 'мастерства.',
  attackBonus: 'Бонус атаки',
  attackBonusPlaceholder: '5',
  attackBonusHint: 'Тоже плоское число — так же, как бонус атаки у действий.',
  components: 'Компоненты не требуются',
  componentsHint:
    'Отметь те, без которых существо накладывает заклинания блока: «без '
    + 'материальных компонентов», «без компонентов заклинания».',
  componentVerbal: 'Вербальные',
  componentSomatic: 'Соматические',
  componentMaterial: 'Материальные',
  note: 'Условие блока',
  notePlaceholder:
    'Например: находясь в пределах 30 футов от двух союзных карг',
  noteHint:
    'Оговорка, при которой блок работает. Числами её не выразить, а терять '
    + 'нельзя — уезжает в выгрузку как есть.',
  groups: 'Группы',
  groupsHint:
    'Группа — это список заклинаний под одним ограничением применений: «По '
    + 'желанию», «1 в день, каждое», «1 в день, на весь список».',
  addGroup: 'Добавить группу',
  removeGroup: 'Удалить группу',
  mode: 'Ограничение применений',
  count: 'Применений',
  countPlaceholder: '2',
  countEachHint:
    'Столько применений у КАЖДОГО заклинания группы — заголовок «2/день '
    + 'каждое».',
  countPoolHint:
    'Столько применений на ВСЮ группу, вместе взятую, — заголовок «2/день».',
  rest: 'Возвращает применения',
  recharge: 'Перезарядка',
  groupLabel: 'Своя подпись',
  groupLabelPlaceholder: 'Оставь пустым — соберётся из ограничения',
  spells: 'Заклинания группы',
  spellsEmpty: 'Заклинаний нет. Выбери их в справочнике ниже.',
  spellCastLevel: 'Круг',
  spellCastLevelHint:
    'Круг, которым существо накладывает заклинание: «(версия 6 уровня)». '
    + 'Пусто — заклинание идёт своим кругом.',
  spellNote: 'Оговорка',
  spellNotePlaceholder: 'Например: только на себя',
  spellRemove: 'Убрать заклинание',
  spellMissing: 'Не найдено',
  spellMissingHint:
    'Заклинания с такой ссылкой в справочнике нет — на виртуальный стол оно '
    + 'не уедет.',
  spellOpen: 'Открыть карточку в новой вкладке',
} as const;

/**
 * Путь списка блоков в состоянии формы существа. Из него собирается путь блока
 * для вложенной формы: без него имена полей блока считались бы от корня, и
 * поле `name` блока совпало бы с названием самого существа.
 */
export const SPELLCASTING_FIELD_PATH = 'spellcasting';

/** Наименьшее число применений: ноль применений — это их отсутствие. */
export const MIN_CREATURE_SPELL_COUNT = 1;

/**
 * Отдых, который подставляется группе «за отдых». Продолжительный: короткий
 * отдых в статблоках 2024 встречается единично.
 */
export const DEFAULT_CREATURE_SPELL_REST: CreatureSpellRestKind = 'LONG';

/** Границы круга, которым существо накладывает заклинание. */
export const CREATURE_SPELL_CAST_LEVEL_MIN = 1;
export const CREATURE_SPELL_CAST_LEVEL_MAX = 9;

/** Вкладки формы существа — в порядке показа. */
export const CREATURE_EDITOR_TABS = {
  main: 'Основное',
  statblock: 'Статблок',
  inventory: CREATURE_INVENTORY_EDITOR.title,
  spells: CREATURE_SPELLCASTING_EDITOR.title,
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
} as const satisfies Record<CreatureActionListKey, string>;

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

/** Наименьшее число в поле «провал в успех, раз в день»: ноль — не умеет. */
export const CREATURE_SAVE_SUCCESS_PER_DAY_MIN = 0;

/** Подписи полей записи боевого блока. */
export const CREATURE_ACTION_LABELS = {
  nameRus: 'Название',
  nameRusPlaceholder: 'Введи название',
  nameEng: 'Название (англ.)',
  nameEngPlaceholder: 'Введи английское название',
  description: 'Описание',
  descriptionPlaceholder: 'Введи описание',
  recharge: 'Перезарядка',
  saveSuccessPerDay: 'Провал спасброска → успех, раз в день',
  saveSuccessPerDayPlaceholder: 'Нет',
  saveSuccessPerDayHint:
    '«Легендарное сопротивление (3/день)»: провалив спасбросок, существо '
    + 'может преуспеть — ведущий решает в окне после броска. Счёт '
    + 'восстанавливает долгий отдых.',
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

/** Подписи урона «или» — как в окне действия системы VTTG. */
export const CREATURE_DAMAGE_ALTERNATIVE_LABELS = {
  title: 'Или другой урон',
  hint:
    'Урон, который целиком заменяет основной. Состояние в формуле варианта '
    + '(вкладки «Статусы цели» и «Статусы атакующего») делает его условием: '
    + '«2к8@self.status.bloodied + 2» берётся сам, когда атакующий окровавлен. '
    + 'Без состояний вариант выбирается при броске или случайно.',
  add: 'Добавить «или»',
  /** Слово над каждым вариантом. */
  or: 'или',
  condition: 'Как выбрать',
  label: 'Подпись',
  labelPlaceholder: 'Необязательно: «С преимуществом»',
  remove: 'Убрать вариант',
  /** «По формуле», а состояния в формуле ещё нет. */
  formulaWithoutStatus:
    'Добавьте состояние во вкладке «Статусы цели» или «Статусы атакующего» — '
    + 'без него вариант не сработает.',
  /** Состояние цели у действия с областью: одной цели там нет. */
  areaTargetWarning:
    'У действия с областью цель не одна — вариант с состоянием цели не '
    + 'сработает.',
} as const;

/** Способы выбора варианта урона «или» для списка. */
export const CREATURE_DAMAGE_CONDITION_OPTIONS: Array<{
  label: string;
  value: CreatureDamageCondition;
}> = CREATURE_DAMAGE_CONDITIONS.map((condition) => ({
  label: CREATURE_DAMAGE_CONDITION_LABELS[condition],
  value: condition,
}));

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
