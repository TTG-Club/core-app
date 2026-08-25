import type {
  SpellDamageFormulaTarget,
  SpellDeliveryType,
  SpellSaveEffect,
  SpellTargetType,
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
    'Как заклинание достигает цели: рукопашная и дальнобойная добавляют бросок '
    + 'атаки, «Касание» требует досягаемости, «На себя» включает '
    + 'автопопадание. Не путать с «Типом цели» — там задают, во что нацелено '
    + 'заклинание.',
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

/** Ключ `FAIR` — прежнее имя огненного урона: встречается в данных до переименования. */
export const SPELL_DAMAGE_TYPE_TAGS: Record<string, string> = {
  ACID: 'dmg.acid',
  BLUDGEONING: 'dmg.bludgeoning',
  COLD: 'dmg.cold',
  FAIR: 'dmg.fire',
  FIRE: 'dmg.fire',
  FORCE: 'dmg.force',
  LIGHTNING: 'dmg.lightning',
  NECROTIC: 'dmg.necrotic',
  PIERCING: 'dmg.piercing',
  POISON: 'dmg.poison',
  PSYCHIC: 'dmg.psychic',
  RADIANT: 'dmg.radiant',
  SLASHING: 'dmg.slashing',
  THUNDER: 'dmg.thunder',
};

export const SPELL_HEALING_TYPE_TAGS: Record<string, string> = {
  HEALING: 'heal',
  TEMPORARY_HIT: 'heal.temp',
  TEMPORARY_HITPOINTS: 'heal.temp',
};

/**
 * Цель части урона. Значения — словарь VTTG (`DamagePartTarget`); в формулу
 * они не пишутся, а хранятся в `SpellEffect.damageFormulaTargets`.
 */
export const SPELL_DAMAGE_FORMULA_TARGET_OPTIONS: Array<
  SpellSelectOption<SpellDamageFormulaTarget>
> = [
  { label: 'Выбранная цель', value: 'selected' },
  { label: 'На себя', value: 'self' },
  { label: 'Указать отдельно', value: 'choose' },
];

/** Подписи строки части урона в редакторе — зеркало `DAMAGE_PART_LABELS` VTTG. */
export const SPELL_DAMAGE_PART_LABELS = {
  partPrefix: 'Урон, часть ',
  formula: 'Формула',
  formulaPlaceholder: 'Например: 8к6@dmg.fire',
  target: 'Цель',
  onlyIfDamaged: 'Только если нанесён урон',
  onlyIfDamagedHint:
    'Часть применится, только если урон по цели действительно прошёл — '
    + '«лечусь, лишь когда задел врага».',
  addPart: 'Добавить часть',
  clear: 'Очистить',
  remove: 'Удалить',
} as const;
export const DEFAULT_SPELL_DAMAGE_FORMULA_TARGET: SpellDamageFormulaTarget =
  'selected';
