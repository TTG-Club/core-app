/**
 * Справочники для редактора активных эффектов заклинания.
 * Значения (`value`) совпадают со словарями VTTG, чтобы экспорт был
 * pass-through. Зеркало: vttg/.../activeEffectTypes.ts + consts.
 */

import type {
  SpellEffectAbility,
  SpellEffectAreaTrigger,
  SpellEffectAuraTarget,
  SpellEffectChange,
  SpellEffectChangeMode,
  SpellEffectConditionKey,
  SpellEffectDamagePartTarget,
  SpellEffectDurationType,
  SpellEffectOrigin,
  SpellEffectSaveOutcome,
  SpellEffectSaveTiming,
} from './effect';

interface Option<Value extends string> {
  label: string;
  value: Value;
}

/** Режимы применения числового изменения. */
export const SPELL_EFFECT_CHANGE_MODE_OPTIONS: Array<
  Option<SpellEffectChangeMode>
> = [
  { label: 'Добавить (+)', value: 'add' },
  { label: 'Умножить (×)', value: 'multiply' },
  { label: 'Перезаписать (=)', value: 'override' },
  { label: 'Улучшить (Max)', value: 'upgrade' },
  { label: 'Ухудшить (Min)', value: 'downgrade' },
  { label: 'Пользовательский', value: 'custom' },
];

/** Источники эффекта. */
export const SPELL_EFFECT_ORIGIN_OPTIONS: Array<Option<SpellEffectOrigin>> = [
  { label: 'Заклинание', value: 'spell' },
  { label: 'Предмет', value: 'item' },
  { label: 'Особенность', value: 'feature' },
  { label: 'Состояние', value: 'condition' },
  { label: 'Вручную', value: 'manual' },
  { label: 'Область', value: 'area' },
];

/** Типы длительности. */
export const SPELL_EFFECT_DURATION_OPTIONS: Array<
  Option<SpellEffectDurationType>
> = [
  { label: 'Постоянно', value: 'permanent' },
  { label: 'Раунды', value: 'rounds' },
  { label: 'Минуты', value: 'minutes' },
  { label: 'Часы', value: 'hours' },
  { label: 'Дни', value: 'days' },
  { label: 'Особое', value: 'special' },
];

/** Типы длительности, у которых есть числовое значение. */
export const SPELL_EFFECT_DURATION_WITH_VALUE: SpellEffectDurationType[] = [
  'rounds',
  'minutes',
  'hours',
  'days',
];

/** Характеристики (полные имена — словарь VTTG). */
export const SPELL_EFFECT_ABILITY_OPTIONS: Array<Option<SpellEffectAbility>> = [
  { label: 'Сила', value: 'strength' },
  { label: 'Ловкость', value: 'dexterity' },
  { label: 'Телосложение', value: 'constitution' },
  { label: 'Интеллект', value: 'intelligence' },
  { label: 'Мудрость', value: 'wisdom' },
  { label: 'Харизма', value: 'charisma' },
];

/** Цель применения эффекта. */
export const SPELL_EFFECT_TARGET_OPTIONS = [
  { label: 'Себе', value: 'self' as const },
  { label: 'Цели', value: 'target' as const },
];

/** Момент периодического спасброска/урона. */
export const SPELL_EFFECT_SAVE_TIMING_OPTIONS: Array<
  Option<SpellEffectSaveTiming>
> = [
  { label: 'В конце хода цели', value: 'endOfTurn' },
  { label: 'В начале хода цели', value: 'startOfTurn' },
];

/** Результат успешного спасброска при наложении. */
export const SPELL_EFFECT_SAVE_OUTCOME_OPTIONS: Array<
  Option<SpellEffectSaveOutcome>
> = [
  { label: 'Отменяет эффект', value: 'negate' },
  { label: 'Половина урона', value: 'half' },
];

/** Триггеры области/ауры. */
export const SPELL_EFFECT_AREA_TRIGGER_OPTIONS: Array<
  Option<SpellEffectAreaTrigger>
> = [
  { label: 'Пока внутри', value: 'stay' },
  { label: 'При входе', value: 'enter' },
  { label: 'При выходе', value: 'exit' },
];

/** Кого задевает аура. */
export const SPELL_EFFECT_AURA_TARGET_OPTIONS: Array<
  Option<SpellEffectAuraTarget>
> = [
  { label: 'Только союзники', value: 'allies' },
  { label: 'Только враги', value: 'enemies' },
  { label: 'Все существа', value: 'all' },
];

/** Ключи стандартных состояний D&D 5e. */
export const SPELL_EFFECT_CONDITION_OPTIONS: Array<
  Option<SpellEffectConditionKey>
> = [
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

/** Типы урона (ключи — словарь VTTG, lowercase). */
export const SPELL_EFFECT_DAMAGE_TYPE_OPTIONS: Array<Option<string>> = [
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
export const SPELL_EFFECT_DAMAGE_TARGET_OPTIONS: Array<
  Option<SpellEffectDamagePartTarget>
> = [
  { label: 'Выбранная цель', value: 'selected' },
  { label: 'На себя', value: 'self' },
  { label: 'Указать отдельно', value: 'choose' },
];

/** Библиотека ключей атрибутов (для поля change.key). */
export const SPELL_EFFECT_TARGET_KEY_SUGGESTIONS: Array<Option<string>> = [
  { value: 'armorClass', label: 'Класс брони (AC)' },
  { value: 'initiative', label: 'Инициатива (бонус)' },
  { value: 'proficiencyBonus', label: 'Бонус мастерства' },
  { value: 'spellSaveDC', label: 'Сложность спасброска от заклинаний' },
  { value: 'hitPoints.max', label: 'Макс. здоровье (HP)' },
  { value: 'hitPoints.temp', label: 'Временные хиты (Temp HP)' },
  { value: 'movement.walk', label: 'Скорость (ходьба)' },
  { value: 'movement.fly', label: 'Скорость (полёт)' },
  { value: 'movement.swim', label: 'Скорость (плавание)' },
  { value: 'movement.climb', label: 'Скорость (лазание)' },
  { value: 'ability.strength', label: 'Сила (очки)' },
  { value: 'ability.dexterity', label: 'Ловкость (очки)' },
  { value: 'ability.constitution', label: 'Телосложение (очки)' },
  { value: 'ability.intelligence', label: 'Интеллект (очки)' },
  { value: 'ability.wisdom', label: 'Мудрость (очки)' },
  { value: 'ability.charisma', label: 'Харизма (очки)' },
  { value: 'save.strength', label: 'Спасбросок (Сила)' },
  { value: 'save.dexterity', label: 'Спасбросок (Ловкость)' },
  { value: 'save.constitution', label: 'Спасбросок (Телосложение)' },
  { value: 'save.intelligence', label: 'Спасбросок (Интеллект)' },
  { value: 'save.wisdom', label: 'Спасбросок (Мудрость)' },
  { value: 'save.charisma', label: 'Спасбросок (Харизма)' },
  { value: 'attack.melee', label: 'Атака: рукопашное оружие' },
  { value: 'attack.ranged', label: 'Атака: дальнобойное оружие' },
  { value: 'attack.spell', label: 'Атака: заклинание' },
  { value: 'damage.melee', label: 'Урон: рукопашное оружие' },
  { value: 'damage.ranged', label: 'Урон: дальнобойное оружие' },
  { value: 'damage.spell', label: 'Урон: заклинание' },
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
export const SPELL_EFFECT_VALUE_SUGGESTIONS: Array<Option<string>> = [
  { value: '@mod.spell', label: 'Модификатор заклинательной хар-ки' },
  { value: '@mod.str', label: 'Модификатор Силы' },
  { value: '@mod.dex', label: 'Модификатор Ловкости' },
  { value: '@mod.con', label: 'Модификатор Телосложения' },
  { value: '@mod.int', label: 'Модификатор Интеллекта' },
  { value: '@mod.wis', label: 'Модификатор Мудрости' },
  { value: '@mod.cha', label: 'Модификатор Харизмы' },
  { value: '@prof', label: 'Бонус мастерства (@prof)' },
  { value: '@level', label: 'Уровень персонажа (@level)' },
  { value: '1к6@dmg.fire', label: 'Урон: Огонь (1к6)' },
  { value: '1к6@dmg.cold', label: 'Урон: Холод' },
  { value: '1к6@dmg.lightning', label: 'Урон: Электричество' },
  { value: '1к6@dmg.necrotic', label: 'Урон: Некроз' },
  { value: '1к6@dmg.radiant', label: 'Урон: Излучение' },
  { value: '1к6@dmg.poison', label: 'Урон: Яд' },
  { value: '1к8@heal', label: 'Лечение (1к8)' },
  { value: '1к8@heal.temp', label: 'Временные хиты (Temp HP)' },
];

/** Библиотека условий (для поля change.condition). */
export const SPELL_EFFECT_CONDITION_EXPR_SUGGESTIONS: Array<Option<string>> = [
  { value: 'roll.hasAdvantage === true', label: 'Бросок: с преимуществом' },
  { value: 'roll.hasDisadvantage === true', label: 'Бросок: с помехой' },
  { value: 'roll.isCritical === true', label: 'Бросок: критическое попадание' },
  { value: 'target.creatureType === "undead"', label: 'Цель: нежить' },
  { value: 'target.creatureType === "fiend"', label: 'Цель: исчадие' },
  { value: 'target.hasCondition("prone")', label: 'Цель: сбита с ног' },
  { value: 'target.hasCondition("poisoned")', label: 'Цель: отравлена' },
  { value: 'target.hp.value === target.hp.max', label: 'Цель: полное HP' },
  { value: 'target.hp.value < target.hp.max', label: 'Цель: ранена' },
  {
    value: 'target.hp.value <= (target.hp.max / 2)',
    label: 'Цель: меньше половины HP',
  },
  { value: 'item.type === "spell"', label: 'Атака: заклинанием' },
  { value: 'target.distance <= 5', label: 'Дистанция: вплотную (≤5 фт)' },
  { value: 'target.distance > 30', label: 'Дистанция: дальше 30 фт' },
  { value: 'incoming.attackType === "melee"', label: 'Защита: от рукопашных' },
  {
    value: 'incoming.attackType === "ranged"',
    label: 'Защита: от дальнобойных',
  },
  { value: 'incoming.attackType === "spell"', label: 'Защита: от заклинаний' },
  { value: 'scene.isDark === true', label: 'Окружение: темнота' },
];

const DEFENSIBLE_DAMAGE_TYPES: Array<Option<string>> =
  SPELL_EFFECT_DAMAGE_TYPE_OPTIONS;

/** Статические флаги (нечисловые эффекты). */
const STATIC_FLAG_OPTIONS: Array<Option<string>> = [
  { value: 'attack.advantage', label: 'Преимущество на все атаки' },
  { value: 'attack.disadvantage', label: 'Помеха на все атаки' },
  {
    value: 'attack.melee.advantage',
    label: 'Преимущество на рукопашные атаки',
  },
  { value: 'attack.melee.disadvantage', label: 'Помеха на рукопашные атаки' },
  {
    value: 'attack.ranged.advantage',
    label: 'Преимущество на дальнобойные атаки',
  },
  {
    value: 'attack.ranged.disadvantage',
    label: 'Помеха на дальнобойные атаки',
  },
  {
    value: 'attack.spell.advantage',
    label: 'Преимущество на атаки заклинанием',
  },
  { value: 'attack.spell.disadvantage', label: 'Помеха на атаки заклинанием' },
  { value: 'attacksAgainst.advantage', label: 'Преимущество атак по существу' },
  { value: 'attacksAgainst.disadvantage', label: 'Помеха атак по существу' },
  { value: 'abilityCheck.advantage', label: 'Преимущество на все проверки' },
  { value: 'abilityCheck.disadvantage', label: 'Помеха на все проверки' },
  { value: 'save.advantage', label: 'Преимущество на все спасброски' },
  { value: 'save.disadvantage', label: 'Помеха на все спасброски' },
  { value: 'save.autoFail.strength', label: 'Автопровал спасбросков: Сила' },
  {
    value: 'save.autoFail.dexterity',
    label: 'Автопровал спасбросков: Ловкость',
  },
  {
    value: 'save.autoFail.constitution',
    label: 'Автопровал спасбросков: Телосложение',
  },
  {
    value: 'save.autoFail.intelligence',
    label: 'Автопровал спасбросков: Интеллект',
  },
  { value: 'save.autoFail.wisdom', label: 'Автопровал спасбросков: Мудрость' },
  { value: 'save.autoFail.charisma', label: 'Автопровал спасбросков: Харизма' },
  { value: 'speed.zero', label: 'Скорость равна нулю' },
  { value: 'incapacitated', label: 'Недееспособен' },
  { value: 'initiative.advantage', label: 'Преимущество на инициативу' },
  { value: 'initiative.disadvantage', label: 'Помеха на инициативу' },
  { value: 'vision.blinded', label: 'Ослеплён' },
  { value: 'vision.invisible', label: 'Невидимый' },
  { value: 'skill.stealth.disadvantage', label: 'Помеха на Скрытность' },
  {
    value: 'defense.critImmunity',
    label: 'Иммунитет к критическим попаданиям',
  },
];

/** Флаги защит от урона (сопротивление/иммунитет/уязвимость) по типам. */
const DAMAGE_DEFENSE_FLAG_OPTIONS: Array<Option<string>> =
  DEFENSIBLE_DAMAGE_TYPES.flatMap((damageType) => [
    {
      value: `resistance.${damageType.value}`,
      label: `Сопротивление: ${damageType.label}`,
    },
    {
      value: `immunity.${damageType.value}`,
      label: `Иммунитет: ${damageType.label}`,
    },
    {
      value: `vulnerability.${damageType.value}`,
      label: `Уязвимость: ${damageType.label}`,
    },
  ]);

/** Полная библиотека флагов (статические + защиты от урона). */
export const SPELL_EFFECT_FLAG_OPTIONS: Array<Option<string>> = [
  ...STATIC_FLAG_OPTIONS,
  ...DAMAGE_DEFENSE_FLAG_OPTIONS,
];

/** Карта label по значению флага — для подписи под выбранным флагом. */
export const SPELL_EFFECT_FLAG_LABEL_MAP: Record<string, string> =
  Object.fromEntries(
    SPELL_EFFECT_FLAG_OPTIONS.map((option) => [option.value, option.label]),
  );

/** Готовый шаблон стандартного состояния D&D 5e для быстрого заполнения. */
export interface SpellEffectConditionTemplate {
  key: SpellEffectConditionKey;
  name: string;
  icon: string;
  description: string;
  flags: string[];
  changes: SpellEffectChange[];
}

/**
 * Шаблоны Active Effects для состояний D&D 5e (PHB 2024) — зеркало
 * `CONDITION_EFFECT_TEMPLATES` + `CONDITIONS` из VTTG. Истощение исключено:
 * его модификаторы зависят от уровня и собираются в VTTG динамически.
 */
export const SPELL_EFFECT_CONDITION_TEMPLATES: SpellEffectConditionTemplate[] =
  [
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
        'Скорость равна 0. Перемещение того, кто схватил, стоит дополнительно.',
      flags: ['speed.zero'],
      changes: [],
    },
    {
      key: 'incapacitated',
      name: 'Недееспособный',
      icon: 'tabler:ban',
      description:
        'Нет действий, бонусных действий и реакций. Нет концентрации. Нельзя говорить. Помеха на инициативу.',
      flags: ['incapacitated', 'initiative.disadvantage'],
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
      flags: [
        'incapacitated',
        'speed.zero',
        'save.autoFail.strength',
        'save.autoFail.dexterity',
        'attacksAgainst.advantage',
      ],
      changes: [],
    },
    {
      key: 'petrified',
      name: 'Окаменевший',
      icon: 'tabler:diamond',
      description:
        'Превращение в камень. Недееспособен. Скорость 0. Автопровал спасбросков СИЛ и ЛОВ. Атаки с преимуществом. Сопротивление всему урону. Иммунитет к яду.',
      flags: [
        'incapacitated',
        'speed.zero',
        'save.autoFail.strength',
        'save.autoFail.dexterity',
        'attacksAgainst.advantage',
      ],
      changes: [],
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
      flags: ['attack.disadvantage'],
      changes: [],
    },
    {
      key: 'restrained',
      name: 'Опутанный',
      icon: 'tabler:link',
      description:
        'Скорость 0, не может быть увеличена. Атаки по вам с преимуществом, ваши — с помехой.',
      flags: ['speed.zero', 'attack.disadvantage', 'attacksAgainst.advantage'],
      changes: [],
    },
    {
      key: 'stunned',
      name: 'Ошеломлённый',
      icon: 'tabler:bolt',
      description:
        'Недееспособен. Автопровал спасбросков СИЛ и ЛОВ. Атаки по вам с преимуществом.',
      flags: [
        'incapacitated',
        'save.autoFail.strength',
        'save.autoFail.dexterity',
        'attacksAgainst.advantage',
      ],
      changes: [],
    },
    {
      key: 'unconscious',
      name: 'Бессознательный',
      icon: 'tabler:zzz',
      description:
        'Недееспособен + лежащий ничком. Скорость 0. Автопровал СИЛ и ЛОВ. Атаки с преимуществом. Крит в пределах 5 фт. Не осознаёте окружение.',
      flags: [
        'incapacitated',
        'speed.zero',
        'save.autoFail.strength',
        'save.autoFail.dexterity',
        'attacksAgainst.advantage',
      ],
      changes: [],
    },
  ];
