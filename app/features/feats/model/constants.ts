import type {
  MechanicChoice,
  MechanicChoiceType,
  SelectOption,
} from '~/shared/types';

import { AbilityKey } from '~/shared/types';

/** Классовые умения, которых может требовать черта. */
export const CLASS_FEATURE_REQUIREMENT_OPTIONS: Array<SelectOption> = [
  { label: 'Использование заклинаний', value: 'SPELLCASTING' },
  { label: 'Магия договора', value: 'PACT_MAGIC' },
  { label: 'Боевой стиль', value: 'FIGHTING_STYLE' },
  { label: 'Оружейные приёмы', value: 'WEAPON_MASTERY' },
];

/** Что игрок выбирает при взятии черты. */
export const FEAT_CHOICE_TYPE_OPTIONS: Array<
  SelectOption & { value: MechanicChoiceType }
> = [
  { label: 'Характеристика', value: 'ABILITY' },
  { label: 'Спасбросок', value: 'SAVING_THROW' },
  { label: 'Навык', value: 'SKILL' },
  { label: 'Инструмент', value: 'TOOL' },
  { label: 'Язык', value: 'LANGUAGE' },
  { label: 'Тип урона', value: 'DAMAGE_TYPE' },
  { label: 'Заклинание', value: 'SPELL' },
  { label: 'Заговор', value: 'CANTRIP' },
  { label: 'Список заклинаний', value: 'SPELL_LIST' },
  { label: 'Заклинательная характеристика', value: 'SPELLCASTING_ABILITY' },
  { label: 'Оружие', value: 'WEAPON' },
  { label: 'Вариант из описания', value: 'OPTION' },
];

/**
 * Ключ по умолчанию для каждого типа выбора. core-api ключ не проверяет и
 * словаря для него не держит: это соглашение редактора, чтобы одинаковые по
 * смыслу выборы в разных чертах звались одинаково, а ссылка `fromChoiceKey`
 * читалась без сверки с описанием черты.
 */
export const FEAT_CHOICE_KEY_BY_TYPE: Record<MechanicChoiceType, string> = {
  ABILITY: 'ability',
  SAVING_THROW: 'saving-throw',
  SKILL: 'skill',
  TOOL: 'tool',
  LANGUAGE: 'language',
  DAMAGE_TYPE: 'damage-type',
  SPELL: 'spell',
  CANTRIP: 'cantrip',
  SPELL_LIST: 'spell-list',
  SPELLCASTING_ABILITY: 'spellcasting-ability',
  WEAPON: 'weapon',
  OPTION: 'option',
};

/** Библиотека ключей выбора (для поля `choice.key`). */
export const FEAT_CHOICE_KEY_SUGGESTIONS: Array<SelectOption> =
  FEAT_CHOICE_TYPE_OPTIONS.map(({ label, value }) => ({
    value: FEAT_CHOICE_KEY_BY_TYPE[value],
    label: `${label} (${FEAT_CHOICE_KEY_BY_TYPE[value]})`,
  }));

/**
 * Что даёт сделанный выбор. Компетентность удваивает бонус мастерства, поэтому
 * это отдельный исход, а не «владение посильнее».
 */
export const FEAT_CHOICE_GRANT_OPTIONS: Array<SelectOption> = [
  { label: 'Владение', value: 'PROFICIENCY' },
  { label: 'Компетентность', value: 'EXPERTISE' },
];

/**
 * Типы выборов, у которых есть уровень владения: только им осмысленны
 * ограничения пула по уже имеющемуся владению. Язык и оружие сюда входят
 * («выберите язык, которого вы не знаете», «оружие, которым вы не владеете»),
 * а тип урона или заклинание — нет: владения у них не бывает.
 */
export const PROFICIENCY_FEAT_CHOICE_TYPES: Array<MechanicChoiceType> = [
  'SKILL',
  'TOOL',
  'SAVING_THROW',
  'LANGUAGE',
  'WEAPON',
];

/**
 * Типы выборов, которые могут дать компетентность. Она удваивает бонус
 * мастерства в проверке, поэтому бывает только у навыков и инструментов: ни у
 * спасброска, ни у языка, ни у оружия удваивать нечего.
 */
export const EXPERTISE_FEAT_CHOICE_TYPES: Array<MechanicChoiceType> = [
  'SKILL',
  'TOOL',
];

/** Типы выборов, которым нужен фильтр заклинаний. */
export const SPELL_FEAT_CHOICE_TYPES: Array<MechanicChoiceType> = [
  'SPELL',
  'CANTRIP',
];

/**
 * Типы выборов, которые редактор больше не предлагает: то же самое говорится
 * другим полем, а два способа сказать одно расходятся в данных.
 *
 * Заговор — это заклинание с уровнем «заговор», и уровень у выбора заклинания
 * задаётся всё равно, поэтому отдельный тип только удваивал бы ответ. Из модели
 * тип не убран: черты, сохранённые с ним, читаются и правятся как раньше.
 */
export const LEGACY_FEAT_CHOICE_TYPES: Array<MechanicChoiceType> = ['CANTRIP'];

/**
 * Раздел формы, к которому относится выбор.
 *
 * Механика черты делится по смыслу — характеристики, владения, заклинания, — и
 * в каждом разделе что-то черта даёт сразу, а что-то игрок выбирает. Одним
 * списком выборы стояли в стороне от той же по смыслу безвыборной выдачи, и
 * увидеть в них «получение заклинаний» было неоткуда.
 */
export type FeatChoiceDomain = 'ABILITY' | 'PROFICIENCY' | 'SPELL' | 'OTHER';

/**
 * Типы выборов раздела «Заклинания». Кроме самих заклинаний сюда входит выбор
 * заклинательной характеристики: она относится к магии черты, а не к повышению
 * характеристик.
 */
export const SPELL_CHOICE_DOMAIN_TYPES: Array<MechanicChoiceType> = [
  ...SPELL_FEAT_CHOICE_TYPES,
  'SPELL_LIST',
  'SPELLCASTING_ABILITY',
];

/**
 * Тип нового выбора в разделе — самый частый в нём: «выберите один навык»
 * встречается чаще прочих владений, заклинание — чаще списка заклинаний.
 * Остальные типы раздела остаются в селекте.
 */
export const FEAT_CHOICE_DEFAULT_TYPE_BY_DOMAIN: Record<
  FeatChoiceDomain,
  MechanicChoiceType
> = {
  ABILITY: 'ABILITY',
  PROFICIENCY: 'SKILL',
  SPELL: 'SPELL',
  OTHER: 'OPTION',
};

/** Подписи и пояснения к разделам механики черты. */
export const FEAT_MECHANICS_EDITOR = {
  /** Заголовок безвыборной части раздела. */
  grantedTitle: 'Даётся чертой',

  /** Заголовок выбираемой части раздела. */
  chosenTitle: 'Даётся на выбор',

  addChoiceLabel: 'Добавить выбор',
  emptyChoicesHint: 'Здесь игрок ничего не выбирает.',

  /** Пометка ссылки на выбор, которого в черте больше нет. */
  missingChoiceHint: 'выбора с таким ключом нет',

  /** Чем выбор раздела отличается от того, что черта выдаёт сразу. */
  choiceHintByDomain: {
    ABILITY:
      'Игрок выбирает характеристику, а повышение выше ссылается на этот выбор.',
    PROFICIENCY:
      'Игрок выбирает, чем владеть: «выберите один навык», «выберите вид оружия».',
    SPELL:
      'Игрок выбирает заклинание сам: «выберите один заговор из списка жреца». Заклинания, которые черта даёт знать всем, перечислены выше.',
    OTHER:
      'Выборы, у которых нет своего раздела: вариант из описания и тип урона для сопротивления. Ключ — имя выбора: по нему на выбор ссылаются модификаторы листа и по нему лист персонажа помнит ответ игрока, поэтому у черты, которую уже могли взять, ключ менять нельзя — сохранённый выбор потеряется.',
  } satisfies Record<FeatChoiceDomain, string>,
} as const;

/** Подписи раздела выдаваемых заклинаний. */
export const FEAT_SPELL_EDITOR = {
  description:
    'Заклинания, которые черта даёт знать без выбора. Круг и школу лист берёт из справочника, поэтому здесь достаточно указать заклинание.',
  spellLabel: 'Заклинание',
  addLabel: 'Добавить заклинание',
  emptyHint: 'Черта не даёт знать заклинания без выбора.',
  abilityLabel: 'Заклинательная характеристика',
  abilityHelp: 'Не указана — лист возьмёт характеристику класса, чья это магия',
  alwaysPreparedLabel: 'Всегда подготовлено',
} as const;

/** Чувства, которые может дать черта. */
export const FEAT_SENSE_OPTIONS: Array<SelectOption> = [
  { label: 'Тёмное зрение', value: 'DARKVISION' },
  { label: 'Слепое зрение', value: 'BLINDSIGHT' },
  { label: 'Истинное зрение', value: 'TRUESIGHT' },
  { label: 'Чувство вибрации', value: 'TREMORSENSE' },
];

/** Время накладывания для фильтра заклинаний. */
export const FEAT_CASTING_TIME_OPTIONS: Array<SelectOption> = [
  { label: 'Действие', value: 'ACTION' },
  { label: 'Бонусное действие', value: 'BONUS' },
  { label: 'Реакция', value: 'REACTION' },
  { label: 'Ритуал', value: 'RITUAL' },
  { label: 'Минута', value: 'MINUTE' },
  { label: 'Час', value: 'HOUR' },
];

/**
 * Есть ли у выбираемого уровень владения: только тогда осмысленны ограничения
 * пула «только с владением» и «только без владения».
 *
 * @param type тип выбора; у незаполненного выбора ответ отрицательный.
 * @returns признак выбора с уровнем владения.
 */
export function isProficiencyChoiceType(
  type: MechanicChoiceType | undefined,
): boolean {
  return !!type && PROFICIENCY_FEAT_CHOICE_TYPES.includes(type);
}

/**
 * Может ли выбор дать компетентность — безусловную или взамен уже имеющегося
 * владения.
 *
 * @param type тип выбора; у незаполненного выбора ответ отрицательный.
 * @returns признак выбора, у которого бывает компетентность.
 */
export function isExpertiseChoiceType(
  type: MechanicChoiceType | undefined,
): boolean {
  return !!type && EXPERTISE_FEAT_CHOICE_TYPES.includes(type);
}

/**
 * Нужен ли выбору фильтр заклинаний.
 *
 * @param type тип выбора; у незаполненного выбора ответ отрицательный.
 * @returns признак выбора заклинания или заговора.
 */
export function isSpellChoiceType(
  type: MechanicChoiceType | undefined,
): boolean {
  return !!type && SPELL_FEAT_CHOICE_TYPES.includes(type);
}

/**
 * Раздел формы, в котором живёт выбор.
 *
 * @param type тип выбора; у незаполненного раздел определить нельзя.
 * @returns раздел формы; `OTHER` — выбор без своего раздела.
 */
export function getFeatChoiceDomain(
  type: MechanicChoiceType | undefined,
): FeatChoiceDomain {
  if (type === 'ABILITY') {
    return 'ABILITY';
  }

  if (isProficiencyChoiceType(type)) {
    return 'PROFICIENCY';
  }

  if (!!type && SPELL_CHOICE_DOMAIN_TYPES.includes(type)) {
    return 'SPELL';
  }

  return 'OTHER';
}

/**
 * Заведённые выборы как варианты привязки к ним.
 *
 * По ключу на сделанный выбор ссылаются повышение характеристик («+1 к
 * выбранной характеристике»), сопротивление типу урона и пул заклинаний
 * («Посвящённый в магию» сначала спрашивает список класса, а потом даёт выбрать
 * из него заговоры). Редактор берёт ключ из списка, а не набирает руками.
 *
 * Пустой привязке отдельного варианта нет: значением списка она была бы пустой
 * строкой, а с ней список не открывается вовсе — снимает привязку кнопка рядом.
 *
 * @param choices выборы черты.
 * @param types типы выборов, годные для привязки; пусто — годятся любые.
 * @returns варианты списка «ключ — подпись».
 */
export function getFeatChoiceLinkOptions(
  choices: Array<MechanicChoice>,
  types: Array<MechanicChoiceType> = [],
): Array<SelectOption> {
  return choices
    .filter(
      (choice) => !types.length || (choice.type && types.includes(choice.type)),
    )
    .map((choice) => ({ key: choice.key.trim(), label: choice.label.trim() }))
    .filter(({ key }) => !!key)
    .map(({ key, label }) => ({
      value: key,
      label: label ? `${key} — ${label}` : key,
    }));
}

/**
 * Варианты привязки вместе с уже записанным ключом: он может ссылаться на
 * выбор, которого в черте больше нет. Молча подменять такую ссылку пустотой
 * нельзя — она уйдёт на сервер потерянной, поэтому значение остаётся в списке с
 * пометкой.
 *
 * @param options варианты привязки.
 * @param key записанный ключ выбора; пустой — подставлять нечего.
 * @returns варианты, среди которых записанный ключ есть наверняка.
 */
export function withFeatChoiceLink(
  options: Array<SelectOption>,
  key: string,
): Array<SelectOption> {
  const trimmed = key.trim();

  if (!trimmed || options.some((option) => option.value === trimmed)) {
    return options;
  }

  return [
    ...options,
    {
      value: trimmed,
      label: `${trimmed} — ${FEAT_MECHANICS_EDITOR.missingChoiceHint}`,
    },
  ];
}

/**
 * Типы выборов, уместные в разделе: селект в разделе «Заклинания» не должен
 * предлагать выбрать навык — для навыка есть раздел «Владения». Устаревшие типы
 * ({@link LEGACY_FEAT_CHOICE_TYPES}) не предлагаются нигде.
 *
 * @param domain раздел формы.
 * @returns варианты для селекта «Что выбирают».
 */
export function getFeatChoiceTypeOptions(
  domain: FeatChoiceDomain,
): Array<SelectOption & { value: MechanicChoiceType }> {
  return FEAT_CHOICE_TYPE_OPTIONS.filter(
    ({ value }) =>
      getFeatChoiceDomain(value) === domain
      && !LEGACY_FEAT_CHOICE_TYPES.includes(value),
  );
}

/**
 * Варианты «Что выбирают» вместе с типом самой записи: у черты, сохранённой
 * раньше, тип может быть из тех, что редактор больше не предлагает. Молча
 * подменять его нельзя — открыв и сохранив черту, редактор потерял бы ответ
 * игрока, поэтому свой тип остаётся в списке.
 *
 * @param options варианты раздела.
 * @param type тип записи; не задан — подставлять нечего.
 * @returns варианты, среди которых тип записи есть наверняка.
 */
export function withFeatChoiceType(
  options: Array<SelectOption & { value: MechanicChoiceType }>,
  type: MechanicChoiceType | undefined,
): Array<SelectOption & { value: MechanicChoiceType }> {
  if (!type || options.some((option) => option.value === type)) {
    return options;
  }

  const legacy = FEAT_CHOICE_TYPE_OPTIONS.find(
    (option) => option.value === type,
  );

  return legacy ? [...options, legacy] : options;
}

/**
 * Подписи полей выбора. Вынесены из шаблона: одна и та же подпись встречается в
 * разных разделах формы, а сверять её по нескольким местам нельзя.
 */
export const FEAT_CHOICE_FIELD_LABELS = {
  key: 'Ключ',
  keyPlaceholder: 'damage-type',
  duplicateKeyError: 'Такой ключ в черте уже есть',
  type: 'Что выбирают',
  label: 'Подпись для игрока',
  labelPlaceholder: 'Выберите тип урона',
  count: 'Сколько выбрать',
  countEqualsProficiencyBonus: 'Количество = бонус мастерства',
  onlyIfNotProficient: 'Только без владения',
  onlyIfProficient: 'Только с владением',
  grants: 'Что даёт выбор',
  expertiseIfProficient: 'Владеет — компетентность',
  rechooseOnLongRest: 'Меняется на отдыхе',
  spellFilter: 'Ограничить заклинания',
  spellLevel: 'Уровень',
  spellMaxLevel: 'Не выше уровня',
  spellSchools: 'Школы',
  castingTime: 'Время накладывания',
  spellClasses: 'Списки классов',
  spellClassesFromChoice: 'Список из выбора',
  abilityOptions: 'Из каких характеристик',
} as const;

/**
 * Характеристики словаря. Нужны выбору характеристики: допустимые значения в
 * механике лежат кодами, а селект принимает только известные ключи — чужое
 * значение из JSONB до него доходить не должно.
 */
export const FEAT_ABILITY_KEYS: Array<AbilityKey> = Object.values(AbilityKey);

/**
 * Типы выборов, у которых допустимые значения задаются характеристиками:
 * «Посвящённый в магию» разрешает Интеллект, Мудрость или Харизму, а не любую.
 */
export const ABILITY_OPTION_CHOICE_TYPES: Array<MechanicChoiceType> = [
  'ABILITY',
  'SPELLCASTING_ABILITY',
];

/**
 * Задаются ли допустимые значения выбора характеристиками.
 *
 * @param type тип выбора; у незаполненного выбора ответ отрицательный.
 * @returns признак выбора из характеристик.
 */
export function isAbilityOptionChoiceType(
  type: MechanicChoiceType | undefined,
): boolean {
  return !!type && ABILITY_OPTION_CHOICE_TYPES.includes(type);
}
