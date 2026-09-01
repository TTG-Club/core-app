import type {
  SpellDeliveryType,
  SpellSaveEffect,
  SpellTargetType,
  SpellUsesRecovery,
} from './create';

interface SpellSelectOption<Value extends string> {
  label: string;
  value: Value;
}

export const SPELL_TARGET_TYPE_OPTIONS: Array<
  SpellSelectOption<SpellTargetType>
> = [
  { label: 'Существо', value: 'CREATURE' },
  { label: 'Предмет', value: 'OBJECT' },
  { label: 'Точка', value: 'POINT' },
  { label: 'На себя', value: 'SELF' },
  { label: 'Область', value: 'AREA' },
  { label: 'Нет цели', value: 'NONE' },
];

/** Подписи блока «Воздействие заклинания» в редакторе. */
export const SPELL_EFFECT_LABELS = {
  title: 'Воздействие заклинания',
  targetType: 'Тип цели',
  targetTypePlaceholder: 'Выбери тип цели',
  targetCount: 'Количество целей',
  targetCountPlaceholder: 'Количество целей',
  autoHit: 'Авто попадание',
  attackType: 'Тип атаки',
  conflictTitle: 'Конфликт настроек',
  conflictDescription:
    'При включённом авто попадании тип атаки и спасброски не должны быть '
    + 'заполнены.',
  savingThrows: 'Спасброски',
  spellcastingAbility: 'Заклинательная характеристика',
  spellcastingAbilityHint: 'необязательно',
  spellcastingAbilityPlaceholder: 'От класса заклинателя',
  saveEffect: 'При успехе',
  saveEffectPlaceholder: 'Выбери эффект',
  conditions: 'Состояния',
  deliveryType: 'Способ применения',
  deliveryTypePlaceholder: 'По типу атаки и дистанции',
  deliveryTypeHint:
    'Способ применения — чем заклинание достаёт цель: рукопашная и '
    + 'дальнобойная добавляют бросок атаки, «Касание» требует досягаемости, '
    + '«На себя» включает автопопадание. «Тип цели» — про другое: во что '
    + 'заклинание нацелено.',
  attackBonus: 'Бонус к атаке',
  attackBonusHint:
    'Фиксированная прибавка сверх характеристики (напр. +1 от магии)',
  scalingTargets: 'Доп. целей за круг',
  scalingTargetsHint: 'На сколько растёт число целей за каждый круг выше',
  areaOfEffect: 'Область воздействия',
  areaValue1: 'Радиус/длина',
  areaValue2: 'Высота/ширина',
  areaValuePlaceholder: 'Значение',
} as const;

/**
 * Вкладки формы заклинания. Порядок повторяет форму системы: чем заклинание
 * является → как применяется → что делает в бою → что оставляет после себя.
 */
export const SPELL_EDITOR_TABS = {
  main: 'Основное',
  usage: 'Применение',
  combat: 'Бой',
  effects: 'Эффекты',
} as const;

/**
 * Заголовки карточек формы. Держатся здесь, а не в разметке: одна и та же
 * подпись стоит и на карточке, и в подсказке соседнего поля.
 */
export const SPELL_EDITOR_SECTIONS = {
  basics: 'Характеристики заклинания',
  description: 'Описание',
  affiliations: 'Принадлежность',
  castingTime: 'Время накладывания',
  range: 'Дистанция',
  components: 'Компоненты (V, S, M)',
  componentsHint:
    'V — вербальный (речь), S — соматический (жесты), M — материальный '
    + '(предмет). Компонент с указанной стоимостью нельзя заменить фокусом.',
  duration: 'Длительность',
  uses: 'Заряды (откат от отдыха)',
  usesHint:
    'Для врождённой магии и заклинаний существ: ограниченное число применений '
    + 'с восстановлением от отдыха. Обычные ячейки заклинателя настраиваются '
    + 'классом и здесь не задаются.',
  targeting: 'Цель и попадание',
  projectiles: 'Снаряды',
  damage: 'Урон и лечение',
  savingThrow: 'Спасбросок и состояния',
} as const;

/** Подписи блока зарядов. */
export const SPELL_USES_LABELS = {
  enable: 'Ограниченное число применений',
  max: 'Максимум зарядов',
  recovery: 'Восстановление',
  atWillHint: 'По желанию: заряды не расходуются, максимум не нужен.',
} as const;

/** Способы восстановления зарядов — зеркало `SPELL_USES_RECOVERY_OPTIONS` VTTG. */
export const SPELL_USES_RECOVERY_OPTIONS: Array<
  SpellSelectOption<SpellUsesRecovery>
> = [
  { label: 'По желанию', value: 'atWill' },
  { label: 'Короткий отдых', value: 'shortRest' },
  { label: 'Продолжительный отдых', value: 'longRest' },
];

/**
 * Способы применения заклинания — зеркало `DELIVERY_TYPE_OPTIONS` из VTTG./**
 * Способы применения заклинания — зеркало `DELIVERY_TYPE_OPTIONS` из VTTG.
 * Не задан — потребитель выводит способ по типу атаки и единице дистанции,
 * как выводил до появления поля.
 */
export const SPELL_DELIVERY_TYPE_OPTIONS: Array<
  SpellSelectOption<SpellDeliveryType>
> = [
  { label: 'Дальнобойная атака', value: 'ranged' },
  { label: 'Рукопашная атака', value: 'melee' },
  { label: 'На себя', value: 'self' },
  { label: 'Касание', value: 'touch' },
  { label: 'Зрение', value: 'sight' },
  { label: 'Нет', value: 'none' },
];

/** Способы применения с броском атаки — только им нужен бонус к атаке. */
export const SPELL_ATTACK_DELIVERY_TYPES: SpellDeliveryType[] = [
  'ranged',
  'melee',
];

/** Подписи полей вкладки «Основное». */
export const SPELL_MAIN_TAB_LABELS = {
  level: 'Уровень заклинания',
  school: 'Школа',
  additionalType: 'Подшкола',
  additionalTypePlaceholder: 'Подшкола',
  description: 'Описание',
  descriptionPlaceholder: 'Введи описание',
  upper: 'На более высоких уровнях',
} as const;

/** Подписи блока принадлежности заклинания. */
export const SPELL_AFFILIATION_LABELS = {
  classes: 'Классы',
  subclasses: 'Подклассы',
  species: 'Виды',
  lineages: 'Происхождения',
  feats: 'Черта',
} as const;

/**
 * Подписи полей вкладки «Применение». Заголовки блоков живут в
 * `SPELL_EDITOR_SECTIONS`, здесь — только поля внутри них.
 */
export const SPELL_USAGE_LABELS = {
  amount: 'Количество',
  amountPlaceholder: 'Введи значение',
  timeUnit: 'Единица времени',
  unitPlaceholder: 'Выбери из списка',
  custom: 'Собственное значение',
  rangeValue: 'Значение',
  rangeUnit: 'Тип дистанции',
  concentration: 'Концентрация',
  verbal: 'Вербальный компонент',
  somatic: 'Соматический компонент',
  material: 'Материальный компонент',
  materialList: 'Список материалов',
  materialListPlaceholder: 'Введи список материалов',
  materialWithCost: 'Материалы имеют цену',
  materialConsumable: 'Материалы расходуются',
} as const;

/** Подписи блока масштабирования заклинания. */
export const SPELL_SCALING_LABELS = {
  title: 'Масштабирование',
  hint: 'Усиление при трате ячейки выше круга заклинания.',
  cantripTitle: 'Масштабирование заговора',
  cantripHint:
    'Усиление с ростом уровня персонажа — ячейки заговоры не тратят.',
  enable: 'Усиление на высших кругах',
  additionalDice: 'Доп. урон за каждый круг',
  additionalDicePlaceholder: '1к6',
  description: 'Описание усиления',
  descriptionPlaceholder: 'Например: урон увеличивается на 1к6 за круг',
  fallbackHint:
    'Не заполнено — потребитель разберёт текст «На более высоких уровнях», '
    + 'как разбирал раньше.',
  cantripTiersHint:
    'Поуровневые тиры: с каждого порога уровня персонажа весь набор частей '
    + 'урона заменяется целиком. До первого тира работают базовые части выше.',
  tierLevel: 'С уровня персонажа',
  tierLevelPlaceholder: '5',
  tierRemove: 'Удалить тир',
  tierAdd: 'Добавить уровень',
  tierPartAdd: 'Добавить часть',
  tierPartsEmpty: 'У тира нет частей — он ничего не заменит.',
} as const;

/**
 * Подсказки снарядного режима: что именно кидается на каждый снаряд. Вид
 * подсказки выводится из «Типа атаки» и «Авто попадания», а не задаётся
 * отдельно, — противоречивую пару так не собрать.
 */
export const SPELL_PROJECTILE_HINTS = {
  autoHit:
    'Снаряды попадают автоматически (как Волшебная стрела): урон кидается за '
    + 'каждый снаряд отдельно.',
  attackRoll:
    'Каждый снаряд — отдельный бросок атаки (как Мистический заряд): урон '
    + 'кидается только за попавшие снаряды.',
  distributed:
    'Снаряды распределяются по целям; урон кидается за каждый снаряд отдельно.',
} as const;

/** Наименьшее число целей: цель либо одна, либо у заклинания другой тип цели. */
export const SPELL_TARGET_COUNT_MIN = 1;

export const SPELL_SAVE_EFFECT_OPTIONS: Array<
  SpellSelectOption<SpellSaveEffect>
> = [
  { label: 'Половина урона', value: 'HALF' },
  { label: 'Нет урона', value: 'NONE' },
  { label: 'Особый', value: 'SPECIAL' },
];

/** Подписи снарядного режима заклинания. */
export const SPELL_PROJECTILE_LABELS = {
  enable: 'Снаряды (отдельный бросок на каждый)',
  count: 'Базовое число снарядов',
  countPlaceholder: 'Число снарядов',
  perSlotLevel: 'Доп. снарядов за круг выше базового',
  perSlotLevelPlaceholder: '0',
  distribution: 'Распределение по целям',
  tiersHint:
    'Пороги уровня персонажа: начиная с указанного уровня число снарядов '
    + 'заменяется целиком (напр. 2 на 5-м, 3 на 11-м, 4 на 17-м).',
  tierLevel: 'С уровня персонажа',
  tierLevelPlaceholder: 'Уровень',
  tierCount: 'Снарядов',
  tierRemove: 'Удалить порог',
  tierAdd: 'Добавить порог',
} as const;

/**
 * Режимы распределения снарядов по целям для радио-группы. `any` — дефолт
 * «свободно», в `SpellProjectiles.targetDistribution` не пишется. Зеркало
 * `PROJECTILE_DISTRIBUTION_OPTIONS` из VTTG.
 */
export const SPELL_PROJECTILE_DISTRIBUTION_OPTIONS = [
  {
    value: 'any',
    label: 'Свободно',
    description: 'В одну цель или в несколько — решается при касте',
  },
  {
    value: 'single',
    label: 'Только одна цель',
    description: 'Выбирается одна цель, все снаряды летят в неё',
  },
  {
    value: 'distinct',
    label: 'Каждый снаряд в свою цель',
    description: 'Нельзя направить два снаряда в одну цель',
  },
] as const;

/**
 * Текст на месте пустого списка частей урона. Свой у каждого раздела: общий
 * редактор частей знает про урон, но не про то, чем ещё носитель может
 * обходиться вместо него.
 */
export const SPELL_DAMAGE_PART_EMPTY =
  'Урона и лечения нет. Заклинание может обходиться без них — например, '
  + 'накладывать состояние или менять числа активным эффектом.';

export const SPELL_HEALING_TYPE_TAGS: Record<string, string> = {
  HEALING: 'heal',
  TEMPORARY_HIT: 'heal.temp',
  TEMPORARY_HITPOINTS: 'heal.temp',
};
