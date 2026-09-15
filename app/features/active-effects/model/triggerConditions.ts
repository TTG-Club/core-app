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
  EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
  EFFECT_CONDITION_AND_SEPARATOR,
  EFFECT_MARKED_BY_SELF_CONDITION,
  EFFECT_TARGET_TYPE_CONDITION_PREFIX,
  isEffectCreatureCategory,
  isEffectDamageType,
  splitConditionParts,
} from './constants';
import {
  DAMAGE_TRIGGER_EVENTS,
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
 * - `otherMarkedBySelf` — другая сторона помечена носителем.
 */
export type TriggerConditionKind = (typeof TRIGGER_CONDITION_KINDS)[number];

/** Какое значение выбирается у части условия. */
export type TriggerConditionParameter = 'damageType' | 'creatureType' | 'tag';

/** Часть условия срабатывания: вид и значение, если оно есть. */
export interface TriggerConditionPart {
  kind: TriggerConditionKind;
  value?: string;
}

/**
 * На каких событиях часть условия что-то значит; `undefined` — на любых. На
 * чужом событии часть не выполняется: данных для неё нет.
 */
const KIND_EVENTS: Record<
  TriggerConditionKind,
  readonly EffectTriggerEvent[] | undefined
> = {
  damageType: DAMAGE_TRIGGER_EVENTS,
  damageTypeNot: DAMAGE_TRIGGER_EVENTS,
  damageCritical: DAMAGE_TRIGGER_EVENTS,
  damageNotCritical: DAMAGE_TRIGGER_EVENTS,
  selfBloodied: undefined,
  selfWounded: undefined,
  selfCreatureType: undefined,
  selfTag: undefined,
  selfTagNot: undefined,
  rollAdvantage: ['attackRoll'],
  rollDisadvantage: ['attackRoll'],
  otherCreatureType: OTHER_PARTY_TRIGGER_EVENTS,
  otherMarkedBySelf: ['attackRoll'],
};

/** Части условия со значением: приставка строки и что выбирается. */
const PARAMETRIC_PARTS: Partial<
  Record<
    TriggerConditionKind,
    { prefix: string; parameter: TriggerConditionParameter }
  >
> = {
  damageType: { prefix: 'damage.type === ', parameter: 'damageType' },
  damageTypeNot: { prefix: 'damage.type !== ', parameter: 'damageType' },
  selfCreatureType: {
    prefix: EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
    parameter: 'creatureType',
  },
  otherCreatureType: {
    prefix: EFFECT_TARGET_TYPE_CONDITION_PREFIX,
    parameter: 'creatureType',
  },
  selfTag: { prefix: 'self.tag === ', parameter: 'tag' },
  selfTagNot: { prefix: 'self.tag !== ', parameter: 'tag' },
};

/** Части условия без значения — строкой целиком. */
const FIXED_PARTS: Partial<Record<TriggerConditionKind, string>> = {
  damageCritical: 'damage.isCritical === true',
  damageNotCritical: 'damage.isCritical === false',
  selfBloodied: 'self.hp.value <= (self.hp.max / 2)',
  selfWounded: 'self.hp.value < self.hp.max',
  rollAdvantage: 'roll.hasAdvantage === true',
  rollDisadvantage: 'roll.hasDisadvantage === true',
  otherMarkedBySelf: EFFECT_MARKED_BY_SELF_CONDITION,
};

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
    default:
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
export function buildTriggerConditionPart(part: TriggerConditionPart): string {
  const parametric = PARAMETRIC_PARTS[part.kind];

  return parametric
    ? `${parametric.prefix}"${part.value ?? ''}"`
    : (FIXED_PARTS[part.kind] ?? '');
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

  for (const kind of TRIGGER_CONDITION_KINDS) {
    if (FIXED_PARTS[kind] === trimmed) {
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
