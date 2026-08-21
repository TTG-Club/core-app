import type {
  SpellDamageFormulaTarget,
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
  areaOfEffect: 'Область воздействия',
  areaValue1: 'Радиус/длина',
  areaValue2: 'Высота/ширина',
  areaValuePlaceholder: 'Значение',
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

export const SPELL_DAMAGE_FORMULA_HEALING_TAGS = [
  { label: 'Лечение', value: 'heal' },
  { label: 'Временные ХП', value: 'heal.temp' },
];

export const SPELL_DAMAGE_FORMULA_DICE = [
  { label: 'к4', value: 4 },
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
  { label: 'к20', value: 20 },
];

export const SPELL_DAMAGE_FORMULA_SEPARATOR = '+';

export const SPELL_DAMAGE_FORMULA_CONDITION_TAGS = [
  { label: 'Полное HP', value: 'target.full' },
  { label: 'Неполное HP', value: 'target.notFull' },
];

export const SPELL_DAMAGE_FORMULA_MODIFIER_TAGS = [
  { label: 'Заклинание', value: 'mod.spell' },
  { label: 'Сила', value: 'mod.str' },
  { label: 'Ловкость', value: 'mod.dex' },
  { label: 'Телосложение', value: 'mod.con' },
  { label: 'Интеллект', value: 'mod.int' },
  { label: 'Мудрость', value: 'mod.wis' },
  { label: 'Харизма', value: 'mod.cha' },
  { label: 'Мастерство', value: 'prof' },
  { label: 'Уровень', value: 'level' },
];

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

export const SPELL_DAMAGE_FORMULA_TOOLS = [
  { label: 'Кости', value: 'dice' },
  { label: 'Тип урона', value: 'damage-type' },
  { label: 'Лечение', value: 'healing' },
  { label: 'Условия', value: 'condition' },
  { label: 'Добавить мод', value: 'modifier' },
];

export const DEFAULT_SPELL_DAMAGE_FORMULA_TOOL = 'modifier';
export const DEFAULT_SPELL_DAMAGE_FORMULA_TARGET: SpellDamageFormulaTarget =
  'selected';
