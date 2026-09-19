/**
 * Условия срабатываний эффекта: «только если урон огнём», «кроме излучения и
 * крита», «цель помечена мной», «носитель окровавлен».
 *
 * Условие — та же строка закрытого словаря, что у модификаторов: части через
 * `&&`, каждая — из перечня. Словарь срабатываний шире: у события есть свои
 * данные (урон, бросок, другая сторона), и отрицание пишется явной частью
 * (`damage.type !== "radiant"`), а не приставкой — так словарь остаётся
 * перечнем. Незнакомая часть в VTTG не выполняется: срабатывание с непонятым
 * условием молчит, а не бьёт всегда.
 *
 * Здесь только разбор и сборка строки: выполняет условие сам VTTG.
 *
 * Зеркало: dnd5-test-migrate/src/engine/triggerConditions.ts
 */

import type { EffectTriggerEvent } from './triggerTypes';

import {
  EFFECT_CARRIER_TAG_CONDITION_PREFIX,
  EFFECT_CARRIER_TAG_NOT_CONDITION_PREFIX,
  EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
  EFFECT_CONDITION_AND_SEPARATOR,
  EFFECT_DAMAGE_TYPE_CONDITION_PREFIX,
  EFFECT_DAMAGE_TYPE_NOT_CONDITION_PREFIX,
  EFFECT_TARGET_TYPE_CONDITION_PREFIX,
  EFFECT_TRIGGER_FIXED_CONDITIONS,
  isEffectCreatureCategory,
  isEffectCreatureSize,
  isEffectDamageType,
  splitConditionParts,
} from './constants';
import {
  DAMAGE_DATA_TRIGGER_EVENTS,
  isEffectTag,
  OTHER_PARTY_TRIGGER_EVENTS,
} from './triggerTypes';

/** Виды частей условия срабатывания. */
export const TRIGGER_CONDITION_KINDS = [
  'damageType',
  'damageTypeNot',
  'damageCritical',
  'damageNotCritical',
  'selfBloodied',
  'selfWounded',
  'selfCreatureType',
  'selfTag',
  'selfTagNot',
  'rollAdvantage',
  'rollDisadvantage',
  'otherCreatureType',
  'otherMarkedBySelf',
  'selfHpAtMost',
  'selfHpAtLeast',
  'selfSizeAtMost',
  'selfSizeAtLeast',
  'selfCondition',
  'selfConditionNot',
  'selfTagCountAtLeast',
  'selfTagFromSource',
  'selfTagFromSourceNot',
  'sourceWeaponMastery',
] as const;

/**
 * Вид части условия:
 * - `damageType` / `damageTypeNot` — урон этого типа / без этого типа;
 * - `damageCritical` / `damageNotCritical` — крит / не крит;
 * - `selfBloodied` / `selfWounded` — у носителя не больше половины хитов / хиты не полные;
 * - `selfCreatureType` — тип носителя;
 * - `selfTag` / `selfTagNot` — на носителе есть / нет отметки;
 * - `rollAdvantage` / `rollDisadvantage` — атака с преимуществом / помехой;
 * - `otherCreatureType` — тип другой стороны;
 * - `otherMarkedBySelf` — другая сторона помечена носителем;
 * - `selfHpAtMost` / `selfHpAtLeast` — хитов у носителя не больше / не меньше N;
 * - `selfSizeAtMost` / `selfSizeAtLeast` — размер носителя не больше / не меньше;
 * - `selfCondition` / `selfConditionNot` — на носителе есть / нет состояния;
 * - `selfTagCountAtLeast` — отметок с ключом на носителе не меньше N (счётчик);
 * - `selfTagFromSource` / `selfTagFromSourceNot` — есть / нет отметки,
 *   поставленной тем же, кто наложил эффект;
 * - `sourceWeaponMastery` — наложение ударом оружия, приёмом которого атакующий
 *   владеет.
 */
export type TriggerConditionKind = (typeof TRIGGER_CONDITION_KINDS)[number];

/** Какое значение выбирается у части условия. */
export type TriggerConditionParameter =
  | 'damageType'
  | 'creatureType'
  | 'tag'
  | 'number'
  | 'size'
  | 'condition';

/** Часть условия срабатывания: вид и значение, если оно есть. */
export interface TriggerConditionPart {
  kind: TriggerConditionKind;
  value?: string;
  /** Порог счётчика отметок (`selfTagCountAtLeast`). */
  amount?: number;
}

/**
 * На каких событиях часть условия что-то значит; `undefined` — на любых. На
 * чужом событии часть не выполняется: данных для неё нет.
 */
const KIND_EVENTS: Record<
  TriggerConditionKind,
  readonly EffectTriggerEvent[] | undefined
> = {
  damageType: DAMAGE_DATA_TRIGGER_EVENTS,
  damageTypeNot: DAMAGE_DATA_TRIGGER_EVENTS,
  damageCritical: DAMAGE_DATA_TRIGGER_EVENTS,
  damageNotCritical: DAMAGE_DATA_TRIGGER_EVENTS,
  selfBloodied: undefined,
  selfWounded: undefined,
  selfCreatureType: undefined,
  selfTag: undefined,
  selfTagNot: undefined,
  rollAdvantage: ['attackRoll'],
  rollDisadvantage: ['attackRoll'],
  otherCreatureType: OTHER_PARTY_TRIGGER_EVENTS,
  otherMarkedBySelf: ['attackRoll'],
  selfHpAtMost: undefined,
  selfHpAtLeast: undefined,
  selfSizeAtMost: undefined,
  selfSizeAtLeast: undefined,
  selfCondition: undefined,
  selfConditionNot: undefined,
  selfTagCountAtLeast: undefined,
  selfTagFromSource: undefined,
  selfTagFromSourceNot: undefined,
  sourceWeaponMastery: ['applied'],
};

/** Части условия со значением: приставка строки и что выбирается. */
const PARAMETRIC_PARTS: Partial<
  Record<
    TriggerConditionKind,
    { prefix: string; parameter: TriggerConditionParameter }
  >
> = {
  damageType: {
    prefix: EFFECT_DAMAGE_TYPE_CONDITION_PREFIX,
    parameter: 'damageType',
  },
  damageTypeNot: {
    prefix: EFFECT_DAMAGE_TYPE_NOT_CONDITION_PREFIX,
    parameter: 'damageType',
  },
  selfCreatureType: {
    prefix: EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
    parameter: 'creatureType',
  },
  otherCreatureType: {
    prefix: EFFECT_TARGET_TYPE_CONDITION_PREFIX,
    parameter: 'creatureType',
  },
  selfTag: { prefix: EFFECT_CARRIER_TAG_CONDITION_PREFIX, parameter: 'tag' },
  selfTagNot: {
    prefix: EFFECT_CARRIER_TAG_NOT_CONDITION_PREFIX,
    parameter: 'tag',
  },
  selfHpAtMost: { prefix: 'self.hp.value <= ', parameter: 'number' },
  selfHpAtLeast: { prefix: 'self.hp.value >= ', parameter: 'number' },
  selfSizeAtMost: { prefix: 'self.size <= ', parameter: 'size' },
  selfSizeAtLeast: { prefix: 'self.size >= ', parameter: 'size' },
  selfCondition: { prefix: 'self.condition === ', parameter: 'condition' },
  selfConditionNot: { prefix: 'self.condition !== ', parameter: 'condition' },
  selfTagCountAtLeast: { prefix: 'self.tagCount[', parameter: 'tag' },
  selfTagFromSource: { prefix: 'self.tagFromSource === ', parameter: 'tag' },
  selfTagFromSourceNot: {
    prefix: 'self.tagFromSource !== ',
    parameter: 'tag',
  },
};

/**
 * Счётчик отметок строкой: `self.tagCount["провал"] >= 3`. Ключ в квадратных
 * скобках — в ключе отметки бывает точка, и через точку его не прочитать.
 */
const TAG_COUNT_PATTERN = /^self\.tagCount\["([^"]+)"\] >= (\d+)$/u;

/** Порог счётчика отметок, пока автор не задал свой. */
export const DEFAULT_TAG_COUNT_THRESHOLD = 3;

/** Наименьший порог счётчика отметок. */
export const MIN_TAG_COUNT_THRESHOLD = 1;

/** Самый большой порог числа в условии: хиты и счётчики. */
const MAX_CONDITION_NUMBER = 100_000;

/** Наименьшее число в условии: отрицательных хитов не бывает. */
export const MIN_CONDITION_NUMBER = 0;

/** Целое неотрицательное число строкой. */
const WHOLE_NUMBER_PATTERN = /^\d+$/;

/**
 * Есть ли у части условия второе число — порог (счётчик отметок).
 *
 * @param kind вид части.
 * @returns `true` для части с порогом.
 */
export function triggerConditionHasAmount(kind: TriggerConditionKind): boolean {
  return kind === 'selfTagCountAtLeast';
}

/**
 * Порог счётчика из ввода: целое не меньше наименьшего.
 *
 * @param value введённое число; пусто — наименьший порог.
 * @returns порог.
 */
export function normalizeTagCountThreshold(
  value: number | null | undefined,
): number {
  return Math.max(
    MIN_TAG_COUNT_THRESHOLD,
    Math.trunc(value ?? MIN_TAG_COUNT_THRESHOLD),
  );
}

/**
 * Годится ли строка числом условия.
 *
 * @param value строка значения.
 * @returns `true` для целого от нуля до предела.
 */
function isConditionNumber(value: string): boolean {
  return (
    WHOLE_NUMBER_PATTERN.test(value) && Number(value) <= MAX_CONDITION_NUMBER
  );
}

/** Кавычки вокруг значения в строке условия. */
const QUOTES_PATTERN = /^["']|["']$/g;

/**
 * Годится ли значение для части условия.
 *
 * @param parameter что выбирается.
 * @param value значение.
 * @returns `true`, если значение из словаря.
 */
function isParameterValue(
  parameter: TriggerConditionParameter,
  value: string,
): boolean {
  switch (parameter) {
    case 'damageType':
      return isEffectDamageType(value);
    case 'creatureType':
      return isEffectCreatureCategory(value);
    case 'number':
      return isConditionNumber(value);
    case 'size':
      return isEffectCreatureSize(value);
    default:
      // Ключ состояния мира и ключ отметки — одного вида: буквы, цифры, «_.-»
      return isEffectTag(value);
  }
}

/**
 * Что выбирается у вида условия.
 *
 * @param kind вид части.
 * @returns параметр либо `undefined`, если значения нет.
 */
export function getTriggerConditionParameter(
  kind: TriggerConditionKind,
): TriggerConditionParameter | undefined {
  return PARAMETRIC_PARTS[kind]?.parameter;
}

/**
 * Строка части условия.
 *
 * @param part вид и значение.
 * @returns строка словаря.
 */
function buildTriggerConditionPart(part: TriggerConditionPart): string {
  if (part.kind === 'selfTagCountAtLeast') {
    return `self.tagCount["${part.value ?? ''}"] >= ${part.amount ?? DEFAULT_TAG_COUNT_THRESHOLD}`;
  }

  const parametric = PARAMETRIC_PARTS[part.kind];

  if (!parametric) {
    return EFFECT_TRIGGER_FIXED_CONDITIONS[part.kind] ?? '';
  }

  // Число пишется без кавычек: `self.hp.value <= 50`
  return parametric.parameter === 'number'
    ? `${parametric.prefix}${part.value ?? '0'}`
    : `${parametric.prefix}"${part.value ?? ''}"`;
}

/**
 * Вид и значение части условия по строке.
 *
 * @param text часть условия.
 * @returns часть либо `null`, если строка не из словаря срабатываний.
 */
export function parseTriggerConditionPart(
  text: string,
): TriggerConditionPart | null {
  const trimmed = text.trim();
  const tagCount = TAG_COUNT_PATTERN.exec(trimmed);

  if (tagCount) {
    const [, tag = '', threshold = ''] = tagCount;

    return isEffectTag(tag) && isConditionNumber(threshold)
      ? { kind: 'selfTagCountAtLeast', value: tag, amount: Number(threshold) }
      : null;
  }

  for (const kind of TRIGGER_CONDITION_KINDS) {
    if (EFFECT_TRIGGER_FIXED_CONDITIONS[kind] === trimmed) {
      return { kind };
    }

    const parametric = PARAMETRIC_PARTS[kind];

    if (parametric && trimmed.startsWith(parametric.prefix)) {
      const value = trimmed
        .slice(parametric.prefix.length)
        .trim()
        .replace(QUOTES_PATTERN, '');

      return isParameterValue(parametric.parameter, value)
        ? { kind, value }
        : null;
    }
  }

  return null;
}

/**
 * Части условия срабатывания: разобранные и строки, которых словарь не знает
 * (их форма показывает как есть, чтобы не терять).
 *
 * @param condition условие срабатывания.
 * @returns части по порядку.
 */
export function readTriggerConditionParts(
  condition: string | undefined,
): Array<TriggerConditionPart | string> {
  return splitConditionParts(condition ?? '').map(
    (text) => parseTriggerConditionPart(text) ?? text,
  );
}

/**
 * Условие срабатывания из частей.
 *
 * @param parts части: разобранные и строки как есть.
 * @returns условие либо `undefined`, если частей нет.
 */
export function writeTriggerCondition(
  parts: ReadonlyArray<TriggerConditionPart | string>,
): string | undefined {
  const texts = parts
    .map((part) =>
      typeof part === 'string' ? part : buildTriggerConditionPart(part),
    )
    .filter((text) => text.length > 0);

  return texts.length > 0
    ? texts.join(` ${EFFECT_CONDITION_AND_SEPARATOR} `)
    : undefined;
}

/**
 * Виды условий, которые что-то значат на событии.
 *
 * @param event событие срабатывания.
 * @returns виды по порядку показа.
 */
export function listTriggerConditionKinds(
  event: EffectTriggerEvent,
): TriggerConditionKind[] {
  return TRIGGER_CONDITION_KINDS.filter((kind) => {
    const events = KIND_EVENTS[kind];

    return events === undefined || events.includes(event);
  });
}
