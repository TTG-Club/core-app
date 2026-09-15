/**
 * Терпимая загрузка активных эффектов с сервера.
 *
 * Внешние данные — `unknown`, форма проверяется Zod (AGENTS.md), но строгий
 * разбор здесь опасен: открыл и сохранил — и всё, чего схема не знает,
 * пропало бы из записи. Поэтому разбор, как у системы, отбрасывает как можно
 * меньше:
 * - эффект выпадает, только если нет `id`/`name` или `changes`, `flags`,
 *   `duration` не той формы;
 * - строки модификаторов и срабатывания разбираются по одной: негодная выпадает
 *   одна;
 * - незнакомое значение необязательного поля обнуляет поле, а не эффект;
 * - числа, набранные строкой, приводятся к числам.
 *
 * Зеркало схем dnd5-test-migrate/src/engine/activeEffectTypes.ts.
 */

import type { EffectTrigger } from './triggerTypes';
import type {
  ActiveEffect,
  EffectAura,
  EffectChange,
  EffectDamagePart,
  EffectDuration,
  EffectRecurringDamage,
  EffectRecurringSave,
  EffectSave,
} from './types';

import { z } from 'zod';

import { EFFECT_CONDITION_OPTIONS, EFFECT_FLAG_LABELS } from './constants';
import {
  EFFECT_TAG_PATTERN,
  EFFECT_TRIGGER_ACTION_GATES,
  EFFECT_TRIGGER_ATTACK_ROLES,
  EFFECT_TRIGGER_EVENTS,
  EFFECT_TRIGGER_LIMIT_PERIODS,
  EFFECT_TRIGGER_RECIPIENTS,
  EFFECT_TRIGGER_RESERVED_EVENTS,
  EFFECT_TRIGGER_TURN_OWNERS,
  MIN_TRIGGER_LIMIT_MAX,
} from './triggerTypes';
import {
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  EFFECT_ORIGIN,
  parseFormNumber,
} from './types';

/** Самая длинная формула Сл срабатывания. */
const MAX_TRIGGER_DC_FORMULA_LENGTH = 200;

/** Самый высокий приоритет модификатора. */
const MAX_EFFECT_CHANGE_PRIORITY = 100;

/**
 * Годные элементы списка по схеме; не список — пусто. Негодный элемент
 * выбрасывается один, а не вместе со всем списком.
 *
 * @param schema схема элемента.
 * @param value значение из данных.
 * @returns разобранные элементы по порядку.
 */
function parseEachValid<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
): Array<z.output<Schema>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((rawElement: unknown) => {
    const validation = schema.safeParse(rawElement);

    return validation.success ? [validation.data] : [];
  });
}

/**
 * Приводит числовое поле формы к числу до проверки схемой: без приведения
 * строка из поля ввода роняла бы разбор всего поля.
 *
 * @param value значение поля как пришло.
 * @returns число, `undefined` для пустого или нечислового ввода, либо исходное
 *   значение, если это не строка и не число.
 */
function coerceOptionalNumber(value: unknown): unknown {
  return typeof value === 'number' || typeof value === 'string'
    ? parseFormNumber(value)
    : value;
}

/** Является ли значение объектом-записью, а не массивом или примитивом. */
const recordSchema = z.record(z.string(), z.unknown());

/** Длительность, когда пришедшая не разобралась: эффект без срока. */
const PERMANENT_DURATION: EffectDuration = { type: 'permanent' };

const abilitySchema = z.enum([
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]);

const conditionKeySchema = z.enum(
  EFFECT_CONDITION_OPTIONS.map((condition) => condition.value),
);

const durationSchema: z.ZodType<EffectDuration> = z.object({
  type: z.enum([
    'permanent',
    'rounds',
    'minutes',
    'hours',
    'days',
    'turn',
    'special',
  ]),
  // Очищенное количество не должно превращать «Раунды» в «Постоянно»
  value: z.preprocess(coerceOptionalNumber, z.number().int().min(0).optional()),
  remaining: z.preprocess(
    coerceOptionalNumber,
    z.number().int().min(0).optional(),
  ),
  turnAnchor: z.enum(['carrier', 'source']).optional().catch(undefined),
  turnTiming: z.enum(['start', 'end']).optional().catch(undefined),
});

const changeSchema: z.ZodType<EffectChange> = z.object({
  key: z.string(),
  mode: z.enum([
    'add',
    'multiply',
    'override',
    'upgrade',
    'downgrade',
    'custom',
  ]),
  value: z.string(),
  condition: z.string().optional().catch(undefined),
  // Очищенный приоритет — не повод терять строку
  priority: z
    .preprocess(
      coerceOptionalNumber,
      z.number().int().min(0).max(MAX_EFFECT_CHANGE_PRIORITY),
    )
    .catch(DEFAULT_EFFECT_CHANGE_PRIORITY),
});

const damagePartSchema: z.ZodType<EffectDamagePart> = z.object({
  formula: z.string(),
  type: z.string().optional().catch(undefined),
  target: z.enum(['selected', 'self', 'choose']).optional().catch(undefined),
  requiresDamage: z.boolean().optional().catch(undefined),
});

/** Части урона по одной: негодная часть не уносит соседние. */
const damagePartsSchema = z
  .array(z.unknown())
  .transform((rawParts) => parseEachValid(damagePartSchema, rawParts));

const auraSchema: z.ZodType<EffectAura> = z.object({
  radius: z.preprocess(coerceOptionalNumber, z.number().min(0)),
  target: z.enum(['allies', 'enemies', 'all']),
  applyToSelf: z.boolean(),
  visible: z.boolean().optional().catch(undefined),
});

/** Сложность спасброска: число, в том числе набранное строкой. */
const saveDcSchema = z.preprocess(coerceOptionalNumber, z.number().int());

const saveSchema: z.ZodType<EffectSave> = z.object({
  ability: abilitySchema,
  dc: saveDcSchema,
  onSuccess: z.enum(['negate', 'half']),
});

const recurringSaveSchema: z.ZodType<EffectRecurringSave> = z.object({
  ability: abilitySchema,
  dc: saveDcSchema,
  timing: z.enum(['startOfTurn', 'endOfTurn']),
});

const recurringDamageSchema: z.ZodType<EffectRecurringDamage> = z.object({
  damageParts: damagePartsSchema,
  timing: z.enum(['startOfTurn', 'endOfTurn']),
  save: saveSchema.optional().catch(undefined),
});

/** Спасбросок срабатывания. */
const triggerSaveSchema = z.object({
  ability: abilitySchema,
  dc: saveDcSchema,
  dcFormula: z
    .string()
    .trim()
    .min(1)
    .max(MAX_TRIGGER_DC_FORMULA_LENGTH)
    .optional()
    .catch(undefined),
});

/** Гейт действия срабатывания. */
const triggerGateSchema = z
  .enum(EFFECT_TRIGGER_ACTION_GATES)
  .optional()
  .catch(undefined);

/**
 * Действие срабатывания. Негодное действие (незнакомый вид, ключ отметки не по
 * образцу, отрицательные хиты) уносит своё срабатывание целиком: без него
 * срабатывание делало бы не то, что задумано.
 */
const triggerActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('damage'),
    parts: damagePartsSchema,
    on: triggerGateSchema,
    halfOnSave: z.literal(true).optional().catch(undefined),
  }),
  z.object({ type: z.literal('applySelf'), on: triggerGateSchema }),
  z.object({
    type: z.literal('applyCondition'),
    conditionKey: z.string().min(1),
    duration: durationSchema.optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('applyTag'),
    tag: z.string().regex(EFFECT_TAG_PATTERN),
    label: z.string().min(1).optional().catch(undefined),
    duration: durationSchema.optional().catch(undefined),
    on: triggerGateSchema,
  }),
  z.object({
    type: z.literal('setHp'),
    value: z.preprocess(coerceOptionalNumber, z.number().int().min(0)),
    on: triggerGateSchema,
  }),
  z.object({ type: z.literal('endCast'), on: triggerGateSchema }),
  z.object({ type: z.literal('removeSelf'), on: triggerGateSchema }),
]);

/** Лимит срабатывания. */
const triggerLimitSchema = z.object({
  max: z.preprocess(
    coerceOptionalNumber,
    z.number().int().min(MIN_TRIGGER_LIMIT_MAX),
  ),
  per: z.enum(EFFECT_TRIGGER_LIMIT_PERIODS),
  key: z.string().min(1).optional().catch(undefined),
});

/**
 * Срабатывание. События следующих фаз разбираются, чтобы форма их не стирала.
 */
const triggerSchema: z.ZodType<EffectTrigger> = z.object({
  id: z.string().min(1),
  event: z.enum([...EFFECT_TRIGGER_EVENTS, ...EFFECT_TRIGGER_RESERVED_EVENTS]),
  turnOf: z.enum(EFFECT_TRIGGER_TURN_OWNERS).optional().catch(undefined),
  role: z.enum(EFFECT_TRIGGER_ATTACK_ROLES).optional().catch(undefined),
  recipient: z.enum(EFFECT_TRIGGER_RECIPIENTS).optional().catch(undefined),
  condition: z.string().min(1).optional().catch(undefined),
  save: triggerSaveSchema.optional().catch(undefined),
  actions: z.array(triggerActionSchema).min(1),
  limit: triggerLimitSchema.optional().catch(undefined),
});

/** Срабатывания по одному: незнакомое событие выбрасывает одно срабатывание. */
const triggersSchema = z
  .array(z.unknown())
  .transform((rawTriggers) => parseEachValid(triggerSchema, rawTriggers));

/**
 * Проверяет, что строка — известный флаг эффекта.
 *
 * @param flag произвольная строка флага.
 * @returns `true`, если такой флаг известен движку.
 */
function isKnownEffectFlag(flag: unknown): flag is string {
  return typeof flag === 'string' && Object.hasOwn(EFFECT_FLAG_LABELS, flag);
}

/**
 * Эффект. Незнакомый флаг выпадает один: движок VTTG сверяет флаги по тому же
 * списку, и потери поведения нет.
 */
const activeEffectSchema: z.ZodType<ActiveEffect> = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().catch(''),
  icon: z.string().optional().catch(undefined),
  disabled: z.boolean().catch(false),
  origin: z.enum(EFFECT_ORIGIN).catch(EFFECT_ORIGIN.manual),
  originId: z.string().optional().catch(undefined),
  transfer: z.boolean().catch(false),
  // Длительность не объектом уносит эффект; объект с негодным типом — только
  // срок: бонусы эффекта дороже его длительности
  duration: recordSchema.transform((rawDuration) => {
    const parsedDuration = durationSchema.safeParse(rawDuration);

    return parsedDuration.success ? parsedDuration.data : PERMANENT_DURATION;
  }),
  changes: z
    .array(z.unknown())
    .transform((rawChanges) => parseEachValid(changeSchema, rawChanges)),
  flags: z
    .array(z.unknown())
    .transform((rawFlags) => rawFlags.filter(isKnownEffectFlag)),
  aura: auraSchema.optional().catch(undefined),
  areaTrigger: z.enum(['stay', 'enter', 'exit']).optional().catch(undefined),
  // Незнакомая доставка обнуляет поле, а не отвергает эффект
  effectTarget: z.enum(['self', 'target', 'zone']).optional().catch(undefined),
  conditionKey: conditionKeySchema.optional().catch(undefined),
  applySave: saveSchema.optional().catch(undefined),
  applyOnSuccess: z.boolean().optional().catch(undefined),
  applyOnSuccessOnly: z.boolean().optional().catch(undefined),
  consumeOn: z
    .enum(['carrierAttack', 'attackOnCarrier'])
    .optional()
    .catch(undefined),
  damageParts: damagePartsSchema.optional().catch(undefined),
  recurringSave: recurringSaveSchema.optional().catch(undefined),
  recurringDamage: recurringDamageSchema.optional().catch(undefined),
  triggers: triggersSchema.optional().catch(undefined),
  conditionImmunities: z
    .array(z.unknown())
    .transform((rawKeys) => parseEachValid(conditionKeySchema, rawKeys))
    .optional()
    .catch(undefined),
  exhaustionLevel: z
    .preprocess(coerceOptionalNumber, z.number().int().min(0).optional())
    .catch(undefined),
});

/**
 * Переносит легаси-поле `type` части урона в токен формулы.
 *
 * Тип урона задаётся токеном `@dmg.<тип>`, а прежний редактор писал его
 * отдельным полем. Без переноса такая часть в форме выглядела бы «без типа»:
 * форма правит формулу, а поля `type` в ней нет.
 *
 * @param part часть урона, как её отдал сервер.
 * @returns часть, у которой тип живёт в формуле.
 */
function migrateEffectDamagePart(part: EffectDamagePart): EffectDamagePart {
  const formula = part.formula;
  const hasTypeToken = formula.includes('@dmg.') || formula.includes('@heal');

  if (!part.type || hasTypeToken) {
    return { ...part, type: undefined };
  }

  return { ...part, formula: `${formula}@dmg.${part.type}`, type: undefined };
}

/**
 * Переносит легаси-типы урона в действиях срабатывания.
 *
 * @param trigger срабатывание.
 * @returns срабатывание с типами урона в формулах.
 */
function migrateTriggerDamageParts(trigger: EffectTrigger): EffectTrigger {
  return {
    ...trigger,
    actions: trigger.actions.map((action) =>
      action.type === 'damage'
        ? { ...action, parts: action.parts.map(migrateEffectDamagePart) }
        : action,
    ),
  };
}

/**
 * Переносит легаси-типы урона во всех частях эффекта: при наложении, в
 * периодическом уроне и в действиях срабатываний.
 *
 * @param effect загруженный эффект.
 * @returns эффект с типами урона в формулах.
 */
function migrateLoadedActiveEffect(effect: ActiveEffect): ActiveEffect {
  return {
    ...effect,
    damageParts: effect.damageParts?.map(migrateEffectDamagePart),
    recurringDamage: effect.recurringDamage
      ? {
          ...effect.recurringDamage,
          damageParts: effect.recurringDamage.damageParts.map(
            migrateEffectDamagePart,
          ),
        }
      : undefined,
    triggers: effect.triggers?.map(migrateTriggerDamageParts),
  };
}

/**
 * Нормализует массив активных эффектов, загруженный с сервера. Каждый эффект
 * разбирается терпимо и отдельно — одна битая запись не обнуляет весь список.
 *
 * @param rawEffects значение поля `activeEffects` из ответа.
 * @returns эффекты, которые удалось разобрать.
 */
export function normalizeLoadedActiveEffects(
  rawEffects: unknown,
): ActiveEffect[] {
  return parseEachValid(activeEffectSchema, rawEffects).map(
    migrateLoadedActiveEffect,
  );
}
