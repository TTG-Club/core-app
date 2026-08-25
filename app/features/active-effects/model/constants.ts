/**
 * Справочники для редактора активных эффектов.
 * Значения (`value`) совпадают со словарями VTTG, чтобы экспорт был
 * pass-through. Зеркало: vttg/.../activeEffectTypes.ts + consts.
 */

import type {
  EffectAbility,
  EffectAreaTrigger,
  EffectAttackTrigger,
  EffectAuraTarget,
  EffectChange,
  EffectChangeMode,
  EffectConditionKey,
  EffectDamagePartTarget,
  EffectDurationType,
  EffectOrigin,
  EffectSaveOutcome,
  EffectSaveTiming,
  EffectTurnAnchor,
  EffectTurnTiming,
} from './types';

interface Option<Value extends string> {
  label: string;
  value: Value;
}

/** Режимы применения числового изменения. */
export const EFFECT_CHANGE_MODE_OPTIONS: Array<Option<EffectChangeMode>> = [
  { label: 'Добавить (+)', value: 'add' },
  { label: 'Умножить (×)', value: 'multiply' },
  { label: 'Перезаписать (=)', value: 'override' },
  { label: 'Улучшить (Max)', value: 'upgrade' },
  { label: 'Ухудшить (Min)', value: 'downgrade' },
  { label: 'Пользовательский', value: 'custom' },
];

/** Источники эффекта. */
export const EFFECT_ORIGIN_OPTIONS: Array<Option<EffectOrigin>> = [
  { label: 'Заклинание', value: 'spell' },
  { label: 'Предмет', value: 'item' },
  { label: 'Особенность', value: 'feature' },
  { label: 'Состояние', value: 'condition' },
  { label: 'Вручную', value: 'manual' },
  { label: 'Область', value: 'area' },
];

/** Типы длительности. */
export const EFFECT_DURATION_OPTIONS: Array<Option<EffectDurationType>> = [
  { label: 'Постоянно', value: 'permanent' },
  { label: 'Раунды', value: 'rounds' },
  { label: 'Минуты', value: 'minutes' },
  { label: 'Часы', value: 'hours' },
  { label: 'Дни', value: 'days' },
  { label: 'До хода (точно)', value: 'turn' },
  { label: 'Особое', value: 'special' },
];

/** Типы длительности, у которых есть числовое значение. */
export const EFFECT_DURATION_WITH_VALUE: EffectDurationType[] = [
  'rounds',
  'minutes',
  'hours',
  'days',
];

/** Чей ход прекращает точную «ходовую» длительность. */
export const EFFECT_TURN_ANCHOR_OPTIONS: Array<Option<EffectTurnAnchor>> = [
  { label: 'носителя (цели)', value: 'carrier' },
  { label: 'источника (кастера)', value: 'source' },
];

/** Момент хода якоря для точной «ходовой» длительности. */
export const EFFECT_TURN_TIMING_OPTIONS: Array<Option<EffectTurnTiming>> = [
  { label: 'в начале хода', value: 'start' },
  { label: 'в конце хода', value: 'end' },
];

/**
 * Значение переключателя «Снять эффект», когда одноразовости нет: в
 * `consumeOn` не пишется, эффект живёт по своей длительности.
 */
export const EFFECT_CONSUME_ON_NONE = 'none';

/** Сегменты переключателя «Снять эффект» (одноразовость на броске атаки). */
export const EFFECT_CONSUME_ON_OPTIONS: Array<{
  value: EffectAttackTrigger | typeof EFFECT_CONSUME_ON_NONE;
  label: string;
  icon: string;
}> = [
  {
    value: EFFECT_CONSUME_ON_NONE,
    label: 'По длительности',
    icon: 'tabler:hourglass',
  },
  {
    value: 'carrierAttack',
    label: 'После своей атаки',
    icon: 'tabler:sword',
  },
  {
    value: 'attackOnCarrier',
    label: 'После атаки по цели',
    icon: 'tabler:target-arrow',
  },
];

/** Характеристики (полные имена — словарь VTTG). */
export const EFFECT_ABILITY_OPTIONS: Array<Option<EffectAbility>> = [
  { label: 'Сила', value: 'strength' },
  { label: 'Ловкость', value: 'dexterity' },
  { label: 'Телосложение', value: 'constitution' },
  { label: 'Интеллект', value: 'intelligence' },
  { label: 'Мудрость', value: 'wisdom' },
  { label: 'Харизма', value: 'charisma' },
];

/** Цель применения эффекта. */
export const EFFECT_TARGET_OPTIONS = [
  { label: 'Себе', value: 'self' as const },
  { label: 'Цели', value: 'target' as const },
];

/** Момент периодического спасброска/урона. */
export const EFFECT_SAVE_TIMING_OPTIONS: Array<Option<EffectSaveTiming>> = [
  { label: 'В конце хода цели', value: 'endOfTurn' },
  { label: 'В начале хода цели', value: 'startOfTurn' },
];

/** Результат успешного спасброска при наложении. */
export const EFFECT_SAVE_OUTCOME_OPTIONS: Array<Option<EffectSaveOutcome>> = [
  { label: 'Отменяет эффект', value: 'negate' },
  { label: 'Половина урона', value: 'half' },
];

/** Триггеры области/ауры. */
export const EFFECT_AREA_TRIGGER_OPTIONS: Array<Option<EffectAreaTrigger>> = [
  { label: 'Пока внутри', value: 'stay' },
  { label: 'При входе', value: 'enter' },
  { label: 'При выходе', value: 'exit' },
];

/** Кого задевает аура. */
export const EFFECT_AURA_TARGET_OPTIONS: Array<Option<EffectAuraTarget>> = [
  { label: 'Только союзники', value: 'allies' },
  { label: 'Только враги', value: 'enemies' },
  { label: 'Все существа', value: 'all' },
];

/** Ключи стандартных состояний D&D 5e. */
export const EFFECT_CONDITION_OPTIONS: Array<Option<EffectConditionKey>> = [
  { label: 'Ослеплён', value: 'blinded' },
  { label: 'Очарован', value: 'charmed' },
  { label: 'Оглохший', value: 'deafened' },
  { label: 'Истощение', value: 'exhaustion' },
  { label: 'Испуган', value: 'frightened' },
  { label: 'Схвачен', value: 'grappled' },
  { label: 'Недееспособен', value: 'incapacitated' },
  { label: 'Невидимый', value: 'invisible' },
  { label: 'Парализован', value: 'paralyzed' },
  { label: 'Окаменел', value: 'petrified' },
  { label: 'Отравлен', value: 'poisoned' },
  { label: 'Сбит с ног', value: 'prone' },
  { label: 'Опутан', value: 'restrained' },
  { label: 'Ошеломлён', value: 'stunned' },
  { label: 'Без сознания', value: 'unconscious' },
];

/**
 * Типы существ для условий эффекта — зеркало `CREATURE_CATEGORIES` из VTTG.
 * Свой список, а не словарь сайта: у справочника бестиария ключи другие
 * (`SLIME`, пять видов `SWARM_OF_*`), а условие сверяет ровно тип VTTG.
 */
export const EFFECT_CREATURE_CATEGORY_OPTIONS: Array<Option<string>> = [
  { label: 'Аберрация', value: 'aberration' },
  { label: 'Зверь', value: 'beast' },
  { label: 'Небожитель', value: 'celestial' },
  { label: 'Конструкт', value: 'construct' },
  { label: 'Дракон', value: 'dragon' },
  { label: 'Элементаль', value: 'elemental' },
  { label: 'Фея', value: 'fey' },
  { label: 'Исчадие', value: 'fiend' },
  { label: 'Великан', value: 'giant' },
  { label: 'Гуманоид', value: 'humanoid' },
  { label: 'Чудовище', value: 'monstrosity' },
  { label: 'Слизь', value: 'ooze' },
  { label: 'Растение', value: 'plant' },
  { label: 'Нежить', value: 'undead' },
  { label: 'Рой', value: 'swarm' },
];

/** Типы урона (ключи — словарь VTTG, lowercase). */
export const EFFECT_DAMAGE_TYPE_OPTIONS: Array<Option<string>> = [
  { label: 'Рубящий', value: 'slashing' },
  { label: 'Колющий', value: 'piercing' },
  { label: 'Дробящий', value: 'bludgeoning' },
  { label: 'Огонь', value: 'fire' },
  { label: 'Холод', value: 'cold' },
  { label: 'Электричество', value: 'lightning' },
  { label: 'Звук', value: 'thunder' },
  { label: 'Яд', value: 'poison' },
  { label: 'Кислота', value: 'acid' },
  { label: 'Некротический', value: 'necrotic' },
  { label: 'Излучение', value: 'radiant' },
  { label: 'Силовое поле', value: 'force' },
  { label: 'Психический', value: 'psychic' },
];

/** Цель части урона эффекта. */
export const EFFECT_DAMAGE_TARGET_OPTIONS: Array<
  Option<EffectDamagePartTarget>
> = [
  { label: 'Выбранная цель', value: 'selected' },
  { label: 'На себя', value: 'self' },
  { label: 'Указать отдельно', value: 'choose' },
];

/**
 * Библиотека ключей атрибутов (для поля change.key) — зеркало
 * `EFFECT_TARGET_SUGGESTIONS` из VTTG. Список закрыт: неизвестный ключ движок
 * молча пропускает, и эффект выглядел бы настроенным, ничего не делая.
 */
export const EFFECT_TARGET_KEY_SUGGESTIONS: Array<Option<string>> = [
  // Базовые параметры
  { value: 'armorClass', label: 'Класс доспеха (AC)' },
  { value: 'initiative', label: 'Инициатива (бонус)' },
  { value: 'proficiencyBonus', label: 'Бонус мастерства' },
  { value: 'spellSaveDC', label: 'Сложность спасброска от заклинаний' },
  { value: 'hitPoints.max', label: 'Макс. здоровье (HP)' },

  // Скорости
  { value: 'movement.walk', label: 'Скорость (ходьба)' },
  { value: 'movement.fly', label: 'Скорость (полёт)' },
  { value: 'movement.swim', label: 'Скорость (плавание)' },
  { value: 'movement.climb', label: 'Скорость (лазание)' },
  { value: 'movement.burrow', label: 'Скорость (копание)' },

  // Чувства (дальность в футах)
  { value: 'sense.darkvision', label: 'Чувство: Тёмное зрение' },
  { value: 'sense.blindsight', label: 'Чувство: Слепое зрение' },
  { value: 'sense.truesight', label: 'Чувство: Истинное зрение' },
  { value: 'sense.tremorsense', label: 'Чувство: Чувство вибрации' },
  { value: 'sense.telepathy', label: 'Чувство: Телепатия' },

  // Характеристики
  { value: 'ability.strength', label: 'Сила (очки)' },
  { value: 'ability.dexterity', label: 'Ловкость (очки)' },
  { value: 'ability.constitution', label: 'Телосложение (очки)' },
  { value: 'ability.intelligence', label: 'Интеллект (очки)' },
  { value: 'ability.wisdom', label: 'Мудрость (очки)' },
  { value: 'ability.charisma', label: 'Харизма (очки)' },

  // Спасброски
  { value: 'save.strength', label: 'Спасбросок (Сила)' },
  { value: 'save.dexterity', label: 'Спасбросок (Ловкость)' },
  { value: 'save.constitution', label: 'Спасбросок (Телосложение)' },
  { value: 'save.intelligence', label: 'Спасбросок (Интеллект)' },
  { value: 'save.wisdom', label: 'Спасбросок (Мудрость)' },
  { value: 'save.charisma', label: 'Спасбросок (Харизма)' },

  // Атаки
  { value: 'attack.melee', label: 'Атака: рукопашное оружие' },
  { value: 'attack.ranged', label: 'Атака: дальнобойное оружие' },
  { value: 'attack.spell', label: 'Атака: заклинание' },

  // Урон
  { value: 'damage.melee', label: 'Урон: рукопашное оружие' },
  { value: 'damage.ranged', label: 'Урон: дальнобойное оружие' },
  { value: 'damage.spell', label: 'Урон: заклинание' },

  // Навыки
  { value: 'skill.acrobatics', label: 'Навык (Акробатика)' },
  { value: 'skill.animalHandling', label: 'Навык (Уход за животными)' },
  { value: 'skill.arcana', label: 'Навык (Аркана)' },
  { value: 'skill.athletics', label: 'Навык (Атлетика)' },
  { value: 'skill.deception', label: 'Навык (Обман)' },
  { value: 'skill.history', label: 'Навык (История)' },
  { value: 'skill.insight', label: 'Навык (Проницательность)' },
  { value: 'skill.investigation', label: 'Навык (Анализ)' },
  { value: 'skill.intimidation', label: 'Навык (Запугивание)' },
  { value: 'skill.medicine', label: 'Навык (Медицина)' },
  { value: 'skill.nature', label: 'Навык (Природа)' },
  { value: 'skill.perception', label: 'Навык (Внимательность)' },
  { value: 'skill.performance', label: 'Навык (Выступление)' },
  { value: 'skill.persuasion', label: 'Навык (Убеждение)' },
  { value: 'skill.religion', label: 'Навык (Религия)' },
  { value: 'skill.sleightOfHand', label: 'Навык (Ловкость рук)' },
  { value: 'skill.stealth', label: 'Навык (Скрытность)' },
  { value: 'skill.survival', label: 'Навык (Выживание)' },
];

/** Библиотека значений/формул (для поля change.value). */
export const EFFECT_VALUE_SUGGESTIONS: Array<Option<string>> = [
  // Характеристики и модификаторы
  { value: '@mod.spell', label: 'Модификатор заклинательной хар-ки' },
  { value: '@mod.str', label: 'Модификатор Силы' },
  { value: '@mod.dex', label: 'Модификатор Ловкости' },
  { value: '@mod.con', label: 'Модификатор Телосложения' },
  { value: '@mod.int', label: 'Модификатор Интеллекта' },
  { value: '@mod.wis', label: 'Модификатор Мудрости' },
  { value: '@mod.cha', label: 'Модификатор Харизмы' },
  { value: '@prof', label: 'Бонус мастерства (@prof)' },
  { value: '@level', label: 'Уровень персонажа (@level)' },

  // Скорости листа: ими задаётся «полёт равен скорости ходьбы»
  { value: '@speed.walk', label: 'Скорость ходьбы листа' },
  { value: '@speed.fly', label: 'Скорость полёта листа' },
  { value: '@speed.swim', label: 'Скорость плавания листа' },
  { value: '@speed.climb', label: 'Скорость лазания листа' },
  { value: '@speed.burrow', label: 'Скорость копания листа' },

  // Типы урона
  { value: '1к6@dmg.fire', label: 'Урон: Огонь (1к6)' },
  { value: '1к6@dmg.cold', label: 'Урон: Холод' },
  { value: '1к6@dmg.lightning', label: 'Урон: Электричество' },
  { value: '1к6@dmg.thunder', label: 'Урон: Звук' },
  { value: '1к6@dmg.acid', label: 'Урон: Кислота' },
  { value: '1к6@dmg.poison', label: 'Урон: Яд' },
  { value: '1к6@dmg.necrotic', label: 'Урон: Некроз' },
  { value: '1к6@dmg.radiant', label: 'Урон: Излучение' },
  { value: '1к6@dmg.force', label: 'Урон: Силовое поле' },
  { value: '1к6@dmg.psychic', label: 'Урон: Психический' },
  { value: '1к6@dmg.bludgeoning', label: 'Урон: Дробящий' },
  { value: '1к6@dmg.piercing', label: 'Урон: Колющий' },
  { value: '1к6@dmg.slashing', label: 'Урон: Рубящий' },

  // Лечение
  { value: '1к8@heal', label: 'Лечение (1к8)' },
  { value: '1к8@heal.temp', label: 'Временные хиты (Temp HP)' },

  // Условия по цели прямо в формуле
  { value: '1к6@target.full', label: 'Формула: только при полном HP цели' },
  { value: '1к6@target.notFull', label: 'Формула: только по раненой цели' },
];

/** Приставка условий по типу НОСИТЕЛЯ эффекта. */
export const EFFECT_CARRIER_TYPE_CONDITION_PREFIX = 'self.creatureType === ';

/** Приставка условий по типу ЦЕЛИ. */
export const EFFECT_TARGET_TYPE_CONDITION_PREFIX = 'target.creatureType === ';

/**
 * Собирает условия по типу существа: движок сверяет тип носителя или цели с
 * названным ключом.
 *
 * @param prefix приставка условия (носитель или цель).
 * @param labelPrefix приставка подписи пункта.
 * @returns условия по всем типам существ.
 */
function buildCreatureTypeConditions(
  prefix: string,
  labelPrefix: string,
): Array<Option<string>> {
  return EFFECT_CREATURE_CATEGORY_OPTIONS.map((creatureType) => ({
    value: `${prefix}"${creatureType.value}"`,
    label: `${labelPrefix}: ${creatureType.label}`,
  }));
}

/**
 * Библиотека условий (для поля change.condition) — зеркало
 * `EFFECT_CONDITION_SUGGESTIONS` из VTTG.
 *
 * Список закрыт и содержит РОВНО те условия, которые движок умеет вычислять:
 * броски, состояние хитов цели, вид входящей атаки (только для `armorClass`) и
 * тип носителя/цели. Неизвестное условие движок молча не применяет — предлагать
 * такие строки нельзя, эффект выглядел бы настроенным и не работал.
 */
export const EFFECT_CONDITION_EXPR_SUGGESTIONS: Array<Option<string>> = [
  { value: 'roll.hasAdvantage === true', label: 'Бросок: с преимуществом' },
  { value: 'roll.hasDisadvantage === true', label: 'Бросок: с помехой' },
  {
    value: 'target.hp.value === target.hp.max',
    label: 'Цель: с полными хитами (Убийца)',
  },
  {
    value: 'target.hp.value < target.hp.max',
    label: 'Цель: ранена (неполные хиты)',
  },
  {
    value: 'target.hp.value <= (target.hp.max / 2)',
    label: 'Цель: не больше половины хитов (Окровавлен)',
  },
  {
    value: 'incoming.attackType === "melee"',
    label: 'Защита: от рукопашных атак (только КД)',
  },
  {
    value: 'incoming.attackType === "ranged"',
    label: 'Защита: от дальнобойных атак (только КД)',
  },
  {
    value: 'incoming.attackType === "spell"',
    label: 'Защита: от атак заклинаниями (только КД)',
  },
  ...buildCreatureTypeConditions(
    EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
    'Носитель',
  ),
  ...buildCreatureTypeConditions(EFFECT_TARGET_TYPE_CONDITION_PREFIX, 'Цель'),
];

/** Виды защит от урона: приставка ключа флага и подпись. */
export const EFFECT_DAMAGE_DEFENSE_KINDS: Array<Option<string>> = [
  { value: 'resistance', label: 'Сопротивление' },
  { value: 'immunity', label: 'Иммунитет' },
  { value: 'vulnerability', label: 'Уязвимость' },
];

/**
 * Собирает подписи флагов по всем характеристикам: помеха на спасброски и
 * проверки задаётся отдельно для каждой из шести.
 *
 * @param keyPrefix приставка ключа флага.
 * @param labelPrefix приставка подписи флага.
 * @returns пары «ключ флага → подпись».
 */
function buildAbilityFlagLabels(
  keyPrefix: string,
  labelPrefix: string,
): Array<[string, string]> {
  return EFFECT_ABILITY_OPTIONS.map((ability) => [
    `${keyPrefix}${ability.value}`,
    `${labelPrefix}: ${ability.label}`,
  ]);
}

/**
 * Подписи флагов защит от урона: три вида защиты на каждый тип урона.
 *
 * @returns пары «ключ флага → подпись».
 */
function buildDamageDefenseFlagLabels(): Array<[string, string]> {
  return EFFECT_DAMAGE_DEFENSE_KINDS.flatMap((kind) =>
    EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType): [string, string] => [
      `${kind.value}.${damageType.value}`,
      `${kind.label}: ${damageType.label}`,
    ]),
  );
}

/**
 * Локализованные названия флагов эффектов — зеркало `EFFECT_FLAG_LABELS` VTTG.
 * Единственный источник и для библиотеки флагов, и для меню «Готовые»: второй
 * список рано или поздно разошёлся бы с первым.
 */
export const EFFECT_FLAG_LABELS: Record<string, string> = Object.fromEntries([
  // Свои атаки
  ['attack.advantage', 'Преимущество на все атаки'],
  ['attack.disadvantage', 'Помеха на все атаки'],
  ['attack.melee.advantage', 'Преимущество на рукопашные атаки'],
  ['attack.melee.disadvantage', 'Помеха на рукопашные атаки'],
  ['attack.ranged.advantage', 'Преимущество на дальнобойные атаки'],
  ['attack.ranged.disadvantage', 'Помеха на дальнобойные атаки'],
  ['attack.spell.advantage', 'Преимущество на атаки заклинаниями'],
  ['attack.spell.disadvantage', 'Помеха на атаки заклинаниями'],

  // Атаки по носителю
  ['attacksAgainst.advantage', 'Преимущество атак по этому существу'],
  ['attacksAgainst.disadvantage', 'Помеха атак по этому существу'],
  [
    'attacksAgainst.melee.advantage',
    'Преимущество рукопашных атак по этому существу',
  ],
  [
    'attacksAgainst.melee.disadvantage',
    'Помеха рукопашных атак по этому существу',
  ],
  [
    'attacksAgainst.ranged.advantage',
    'Преимущество дальнобойных атак по этому существу',
  ],
  [
    'attacksAgainst.ranged.disadvantage',
    'Помеха дальнобойных атак по этому существу',
  ],

  // Проверки характеристик
  ['abilityCheck.advantage', 'Преимущество на ВСЕ проверки характеристик'],
  ['abilityCheck.disadvantage', 'Помеха на ВСЕ проверки характеристик'],
  ...buildAbilityFlagLabels(
    'abilityCheck.advantage.',
    'Преимущество на проверки',
  ),
  ...buildAbilityFlagLabels('abilityCheck.disadvantage.', 'Помеха на проверки'),

  // Навыки
  ['skill.stealth.disadvantage', 'Помеха на проверки: Скрытность'],

  // Спасброски
  ['save.advantage', 'Преимущество на ВСЕ спасброски'],
  ['save.disadvantage', 'Помеха на ВСЕ спасброски'],
  ...buildAbilityFlagLabels('save.advantage.', 'Преимущество на спасброски'),
  ...buildAbilityFlagLabels('save.disadvantage.', 'Помеха на спасброски'),
  ...buildAbilityFlagLabels('save.autoFail.', 'Автопровал спасбросков'),

  // Прочее
  ['speed.zero', 'Скорость равна нулю'],
  ['incapacitated', 'Недееспособен (нет действий и реакций)'],
  ['initiative.advantage', 'Преимущество на бросок инициативы'],
  ['initiative.disadvantage', 'Помеха на бросок инициативы'],
  ['vision.blinded', 'Ослеплён (ничего не видит, автопровал проверок зрения)'],
  ['vision.invisible', 'Невидимый (скрыт от глаз, преимущество на атаки)'],
  ['defense.critImmunity', 'Защита: иммунитет к критическим попаданиям'],

  // Защиты от урона
  ...buildDamageDefenseFlagLabels(),
]);

/** Полная библиотека флагов для поля выбора. */
export const EFFECT_FLAG_OPTIONS: Array<Option<string>> = Object.entries(
  EFFECT_FLAG_LABELS,
).map(([value, label]) => ({ value, label }));

/** Готовый шаблон стандартного состояния D&D 5e для быстрого заполнения. */
export interface EffectConditionTemplate {
  key: EffectConditionKey;
  name: string;
  icon: string;
  description: string;
  flags: string[];
  changes: EffectChange[];
  conditionImmunities?: EffectConditionKey[];
}

/**
 * Следствия Недееспособности (PHB 2024): само состояние плюс помеха на
 * инициативу. Состояния, включающие Недееспособность, наследуют их целиком.
 */
const INCAPACITATED_FLAGS: string[] = [
  'incapacitated',
  'initiative.disadvantage',
];

/**
 * Следствия беспомощности (PHB 2024): автопровал спасбросков Силы и Ловкости и
 * преимущество атак по существу.
 */
const HELPLESS_FLAGS: string[] = [
  'save.autoFail.strength',
  'save.autoFail.dexterity',
  'attacksAgainst.advantage',
];

/**
 * Поправки атак по лежащему (PHB 2024): вплотную — преимущество, издали —
 * помеха. Дистанцию движок в этом месте не знает, поэтому правило приближено по
 * виду атаки.
 */
const PRONE_ATTACKED_FLAGS: string[] = [
  'attacksAgainst.melee.advantage',
  'attacksAgainst.ranged.disadvantage',
];

/** Сопротивление всему урону — по флагу на каждый тип урона. */
const ALL_DAMAGE_RESISTANCE_FLAGS: string[] = EFFECT_DAMAGE_TYPE_OPTIONS.map(
  (damageType) => `resistance.${damageType.value}`,
);

/**
 * Шаблоны Active Effects для состояний D&D 5e (PHB 2024) — зеркало
 * `CONDITION_EFFECT_TEMPLATES` + `CONDITIONS` из VTTG. Истощение исключено:
 * его модификаторы зависят от степени и собираются в VTTG динамически.
 */
export const EFFECT_CONDITION_TEMPLATES: EffectConditionTemplate[] = [
  {
    key: 'blinded',
    name: 'Ослеплённый',
    icon: 'tabler:eye-off',
    description:
      'Автоматический провал проверок, требующих зрение. Броски атаки против вас с преимуществом, ваши — с помехой.',
    flags: [
      'attack.disadvantage',
      'attacksAgainst.advantage',
      'vision.blinded',
    ],
    changes: [],
  },
  {
    key: 'charmed',
    name: 'Очарованный',
    icon: 'tabler:heart',
    description:
      'Нельзя атаковать или вредить очаровавшему. Очаровавший имеет преимущество на социальные проверки против вас.',
    flags: [],
    changes: [],
  },
  {
    key: 'deafened',
    name: 'Оглохший',
    icon: 'tabler:ear-off',
    description:
      'Не можете слышать. Автоматический провал проверок, требующих слух.',
    flags: [],
    changes: [],
  },
  {
    key: 'frightened',
    name: 'Испуганный',
    icon: 'tabler:mood-sad',
    description:
      'Помеха на проверки характеристик и броски атаки, пока источник страха в зоне видимости. Нельзя добровольно приблизиться к источнику.',
    flags: ['attack.disadvantage', 'abilityCheck.disadvantage'],
    changes: [],
  },
  {
    key: 'grappled',
    name: 'Схваченный',
    icon: 'tabler:hand-stop',
    description:
      'Скорость равна 0. Помеха на броски атаки по любой цели, кроме схватившего. Схвативший может тащить существо за собой.',
    flags: ['speed.zero'],
    changes: [],
  },
  {
    key: 'incapacitated',
    name: 'Недееспособный',
    icon: 'tabler:ban',
    description:
      'Нет действий, бонусных действий и реакций. Нет концентрации. Нельзя говорить. Помеха на инициативу.',
    flags: [...INCAPACITATED_FLAGS],
    changes: [],
  },
  {
    key: 'invisible',
    name: 'Невидимый',
    icon: 'tabler:eye-closed',
    description:
      'Преимущество на инициативу. Атаки против вас с помехой, ваши — с преимуществом. Не подвержены эффектам, требующим видимость цели.',
    flags: [
      'attack.advantage',
      'attacksAgainst.disadvantage',
      'initiative.advantage',
      'vision.invisible',
    ],
    changes: [],
  },
  {
    key: 'paralyzed',
    name: 'Парализованный',
    icon: 'tabler:user-minus',
    description:
      'Недееспособен. Скорость 0. Автопровал спасбросков СИЛ и ЛОВ. Атаки по вам с преимуществом. Крит в пределах 5 фт.',
    flags: [...INCAPACITATED_FLAGS, 'speed.zero', ...HELPLESS_FLAGS],
    changes: [],
  },
  {
    key: 'petrified',
    name: 'Окаменевший',
    icon: 'tabler:diamond',
    description:
      'Превращение в камень. Недееспособен. Скорость 0. Автопровал спасбросков СИЛ и ЛОВ. Атаки с преимуществом. Сопротивление всему урону. Иммунитет к яду.',
    flags: [
      ...INCAPACITATED_FLAGS,
      'speed.zero',
      ...HELPLESS_FLAGS,
      ...ALL_DAMAGE_RESISTANCE_FLAGS,
    ],
    changes: [],
    // Иммунитет к Отравлению — само состояние; урон ядом лишь ослаблен выше.
    conditionImmunities: ['poisoned'],
  },
  {
    key: 'poisoned',
    name: 'Отравленный',
    icon: 'tabler:droplet',
    description: 'Помеха на броски атаки и проверки характеристик.',
    flags: ['attack.disadvantage', 'abilityCheck.disadvantage'],
    changes: [],
  },
  {
    key: 'prone',
    name: 'Лежащий ничком',
    icon: 'tabler:download',
    description:
      'Передвижение только ползком или подъём (½ скорости). Помеха на ваши атаки. Преимущество атак в пределах 5 фт, иначе помеха.',
    flags: ['attack.disadvantage', ...PRONE_ATTACKED_FLAGS],
    changes: [],
  },
  {
    key: 'restrained',
    name: 'Опутанный',
    icon: 'tabler:link',
    description:
      'Скорость 0, не может быть увеличена. Атаки по вам с преимуществом, ваши — с помехой. Помеха на спасброски Ловкости.',
    flags: [
      'speed.zero',
      'attack.disadvantage',
      'attacksAgainst.advantage',
      'save.disadvantage.dexterity',
    ],
    changes: [],
  },
  {
    key: 'stunned',
    name: 'Ошеломлённый',
    icon: 'tabler:bolt',
    description:
      'Недееспособен. Автопровал спасбросков СИЛ и ЛОВ. Атаки по вам с преимуществом.',
    // Скорость НЕ обнуляется: у Ошеломлённого 2024 нет пункта «не может
    // двигаться» — в отличие от Парализованного и Без сознания.
    flags: [...INCAPACITATED_FLAGS, ...HELPLESS_FLAGS],
    changes: [],
  },
  {
    key: 'unconscious',
    name: 'Бессознательный',
    icon: 'tabler:zzz',
    description:
      'Недееспособен + лежащий ничком. Скорость 0. Автопровал СИЛ и ЛОВ. Атаки с преимуществом. Крит в пределах 5 фт. Не осознаёте окружение.',
    flags: [
      ...INCAPACITATED_FLAGS,
      'speed.zero',
      ...HELPLESS_FLAGS,
      'attack.disadvantage',
      ...PRONE_ATTACKED_FLAGS,
    ],
    changes: [],
  },
];

/** Подписи блока активных эффектов и его подсказок. */
export const ACTIVE_EFFECT_LABELS = {
  title: 'Активные эффекты',
  subtitle:
    'Считаются листом персонажа на сайте и переносятся в виртуальный стол VTTG',
  empty:
    'Нет активных эффектов. Добавь эффект, чтобы запись меняла числа на листе '
    + 'персонажа — класс доспеха, спасброски, характеристики — или накладывала '
    + 'состояния и ауры в VTTG.',
  add: 'Добавить эффект',
  remove: 'Удалить эффект',
  unnamed: 'Эффект без названия',
  expand: 'Развернуть эффект',
  collapse: 'Свернуть эффект',
  removeConfirmTitle: 'Удалить эффект?',
  removeConfirmText:
    'Эффект и все его настройки — модификаторы, флаги, урон — исчезнут из '
    + 'записи. Отменить это можно только не сохраняя форму.',
  removeConfirmCancel: 'Отмена',
  removeConfirmApply: 'Удалить',
  description: 'Описание',
  descriptionPlaceholder:
    'Чем эффект оборачивается для носителя — коротко, своими словами',
  generate: 'Сгенерировать',
  generateHint: 'Собрать описание из настроек эффекта',
  presets: 'Готовые',
  presetsFlagsHint: 'Флаг с готовым ключом — разделами',
  presetsChangesHint: 'Строка с готовым ключом, режимом и значением',
  consumeOn: 'Снять эффект',
  consumeOnHint:
    'Одноразовость на броске атаки: эффект сгорает после первого подходящего '
    + 'броска, не дожидаясь конца длительности («на следующую атаку»).',
  durationTurn: 'До хода',
  durationTurnHint:
    'Точная «ходовая» длительность: эффект снимается в начале или конце хода '
    + 'носителя либо кастера — смотря что выбрано.',
  applyOnSuccessOnly: 'Накладывать только при успешном спасе',
  applyOnSuccessOnlyHint:
    'Зеркало настройки выше: эффект повиснет ТОЛЬКО при успехе и не '
    + 'наложится при провале. Нужно заклинаниям с разными исходами (Луч '
    + 'слабости).',
  conditionImmunities: 'Иммунитет к состояниям',
  conditionImmunitiesHint:
    'Пока эффект висит, носитель не подвержен выбранным состояниям (напр. '
    + 'Окаменевший даёт иммунитет к Отравлению).',
  conditionImmunitiesPlaceholder: 'Выбери состояния',
  damagePartTarget: 'Цель',
  damagePartRequiresDamage: 'Только если по цели нанесён урон',
  damagePartAdd: 'Добавить урон',
} as const;
