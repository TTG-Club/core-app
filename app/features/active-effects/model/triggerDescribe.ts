/**
 * Фраза срабатывания для сводки эффекта.
 *
 * Срабатывания, которые выражает старое поле (урон каждый ход, повторный
 * спасбросок, снятие после атаки), описываются прежними фразами — сводка
 * существующих эффектов не меняется. Остальные собираются из частей: когда,
 * при каком условии, какой спасбросок, что при провале и успехе, как часто.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectTriggerDescribe.ts
 */

import type { TriggerConditionKind } from './triggerConditions';
import type {
  EffectTrigger,
  EffectTriggerAction,
  EffectTriggerEvent,
  EffectTriggerLimitPeriod,
} from './triggerTypes';
import type { EffectDuration } from './types';

import {
  EFFECT_ABILITY_GENITIVE_LABELS,
  EFFECT_CREATURE_CATEGORY_OPTIONS,
  EFFECT_DAMAGE_TYPE_SHORT_LABELS,
} from './constants';
import {
  describeConditionName,
  describeEffectChangeCondition,
  describeEffectDamageParts,
  describeEffectDuration,
} from './describe';
import { readTriggerConditionParts } from './triggerConditions';
import {
  classifyLegacyTrigger,
  isTurnTriggerEvent,
  resolveTriggerActionGate,
} from './triggers';

/** Переменная урона события в Сл срабатывания. */
const EVENT_DAMAGE_VARIABLE = 'damage';

/** Что даёт успех спасброска против урона каждый ход. */
const RECURRING_DAMAGE_SUCCESS_LABELS = {
  negate: 'без урона',
  half: 'половина урона',
} as const;

/** Снятие после атаки — продолжением перечисления. */
const CONSUME_ON_LABELS = {
  attacker: 'снимается после своей атаки',
  target: 'снимается после атаки по носителю',
} as const;

/** Когда срабатывает — по событию. */
const TRIGGER_EVENT_LABELS: Record<EffectTriggerEvent, string> = {
  turnStart: 'в начале хода',
  turnEnd: 'в конце хода',
  enter: 'при входе',
  exit: 'при выходе',
  applied: 'при наложении',
  attackRoll: 'при броске атаки',
  damageTaken: 'при получении урона',
  hpZero: 'когда хиты падают до 0',
  rest: 'после отдыха',
  activate: 'при включении',
  castEnd: 'когда заклинание заканчивается',
};

/** Бросок атаки — по роли субъекта. */
const ATTACK_ROLE_EVENT_LABELS = {
  attacker: 'после своей атаки',
  target: 'после атаки по носителю',
} as const;

/** Период лимита — «не чаще … за ход». */
const LIMIT_PERIOD_LABELS: Record<EffectTriggerLimitPeriod, string> = {
  turn: 'ход',
  round: 'раунд',
  shortRest: 'короткий отдых',
  longRest: 'долгий отдых',
};

/** Части фраз срабатывания. */
const TRIGGER_LABELS = {
  everyTurnPrefix: 'каждый ход ',
  startOfTurn: ' в начале хода',
  endOfTurn: ' в конце хода',
  sourceTurnSuffix: ' источника',
  damageSaveSuccess: ': успех — ',
  recurringSavePrefix: 'повторный спасбросок ',
  recurringSaveSuffix: ' снимает эффект',
  savePrefix: 'спасбросок ',
  failurePrefix: 'провал — ',
  successPrefix: 'успех — ',
  conditionPrefix: ', если ',
  halfDamage: 'половина урона',
  effect: 'эффект',
  removeSelf: 'эффект снимается',
  tagPrefix: 'отметка ',
  conditionJoiner: ' и ',
  setHpPrefix: 'хиты становятся ',
  endCast: 'каст заканчивается',
  dcFormulaPrefix: 'Сл = ',
  damageVariable: 'урон',
  recipientOther: ', на другую сторону',
  nothing: 'ничего',
  listJoiner: ', ',
  clauseJoiner: '; ',
  limitPrefix: ', не чаще ',
  limitOnce: 'одного раза',
  limitTimes: ' раз',
  limitPeriodPrefix: ' за ',
} as const;

/** Настройки фразы. */
export interface EffectTriggerDescribeOptions {
  /** Подпись Сл (0 — Сл источника по месту формы). */
  formatDc: (dc: number) => string;
}

/** Подписи типов существ по ключу. */
const CREATURE_TYPE_LABELS = new Map(
  EFFECT_CREATURE_CATEGORY_OPTIONS.map((creatureType) => [
    creatureType.value,
    creatureType.label,
  ]),
);

/**
 * Подпись типа существа.
 *
 * @param value ключ типа.
 * @returns подпись либо ключ.
 */
function describeCreatureType(value: string): string {
  return CREATURE_TYPE_LABELS.get(value) ?? value;
}

/**
 * Краткая подпись типа урона.
 *
 * @param value ключ типа урона.
 * @returns подпись либо ключ.
 */
function describeDamageType(value: string): string {
  return EFFECT_DAMAGE_TYPE_SHORT_LABELS[value] ?? value;
}

/** Подписи частей условия срабатывания; значение — тип урона, существа, отметка. */
const TRIGGER_CONDITION_PHRASES: Record<
  TriggerConditionKind,
  (value: string) => string
> = {
  damageType: (value) => `урон ${describeDamageType(value)}`,
  damageTypeNot: (value) => `урон не ${describeDamageType(value)}`,
  damageCritical: () => 'критическое попадание',
  damageNotCritical: () => 'не критическое попадание',
  selfBloodied: () => 'у носителя не больше половины хитов',
  selfWounded: () => 'носитель ранен',
  selfCreatureType: (value) => `носитель — ${describeCreatureType(value)}`,
  selfTag: (value) => `на носителе отметка «${value}»`,
  selfTagNot: (value) => `на носителе нет отметки «${value}»`,
  rollAdvantage: () => 'атака с преимуществом',
  rollDisadvantage: () => 'атака с помехой',
  otherCreatureType: (value) =>
    `другая сторона — ${describeCreatureType(value)}`,
  otherMarkedBySelf: () => 'другая сторона помечена носителем',
};

/**
 * Подпись условия срабатывания: части словаря срабатываний — фразой, остальные
 * — как у модификаторов (незнакомая часть остаётся кодом).
 *
 * @param condition условие срабатывания.
 * @returns подпись.
 */
export function describeTriggerCondition(condition: string): string {
  return readTriggerConditionParts(condition)
    .map((part) =>
      typeof part === 'string'
        ? describeEffectChangeCondition(part)
        : TRIGGER_CONDITION_PHRASES[part.kind](part.value ?? ''),
    )
    .join(TRIGGER_LABELS.conditionJoiner);
}

/**
 * Подпись наложенного со сроком, если он задан: «„Отравлен“ на 1 раунд».
 *
 * @param name подпись наложенного.
 * @param duration срок; без него — до снятия или срок по умолчанию.
 * @returns подпись.
 */
function withDurationSuffix(
  name: string,
  duration: EffectDuration | undefined,
): string {
  const suffix = duration ? describeEffectDuration(duration) : null;

  return suffix ? `${name} ${suffix}` : name;
}

/**
 * Подпись действия.
 *
 * @param action действие.
 * @returns подпись либо пустая строка, если описывать нечего.
 */
function describeAction(action: EffectTriggerAction): string {
  switch (action.type) {
    case 'damage':
      return describeEffectDamageParts(action.parts);
    case 'applySelf':
      return TRIGGER_LABELS.effect;
    case 'applyCondition':
      return withDurationSuffix(
        `«${describeConditionName(action.conditionKey)}»`,
        action.duration,
      );
    case 'applyTag':
      return withDurationSuffix(
        `${TRIGGER_LABELS.tagPrefix}«${action.label ?? action.tag}»`,
        action.duration,
      );
    case 'setHp':
      return `${TRIGGER_LABELS.setHpPrefix}${action.value}`;
    case 'endCast':
      return TRIGGER_LABELS.endCast;
    case 'removeSelf':
      return TRIGGER_LABELS.removeSelf;
    default:
      return '';
  }
}

/**
 * Подпись действий, которые выполнятся при данном исходе спасброска.
 *
 * @param trigger срабатывание.
 * @param saved пройден ли спасбросок.
 * @returns перечисление либо «ничего».
 */
function describeOutcomeActions(
  trigger: EffectTrigger,
  saved: boolean,
): string {
  const parts = trigger.actions.flatMap((action) => {
    const gate = resolveTriggerActionGate(trigger, action);

    if (gate === (saved ? 'failed' : 'saved')) {
      return [];
    }

    if (saved && action.type === 'damage' && action.halfOnSave) {
      return [TRIGGER_LABELS.halfDamage];
    }

    const label = describeAction(action);

    return label ? [label] : [];
  });

  return parts.length > 0
    ? parts.join(TRIGGER_LABELS.listJoiner)
    : TRIGGER_LABELS.nothing;
}

/**
 * Когда срабатывает.
 *
 * @param trigger срабатывание.
 * @returns подпись момента.
 */
function describeMoment(trigger: EffectTrigger): string {
  if (trigger.event === 'attackRoll' && trigger.role) {
    return ATTACK_ROLE_EVENT_LABELS[trigger.role];
  }

  const label = TRIGGER_EVENT_LABELS[trigger.event];

  return isTurnTriggerEvent(trigger.event) && trigger.turnOf === 'source'
    ? `${label}${TRIGGER_LABELS.sourceTurnSuffix}`
    : label;
}

/**
 * Прежняя фраза срабатывания, которое выражает старое поле.
 *
 * @param trigger срабатывание.
 * @param options настройки.
 * @returns фраза, пустая строка (описывать нечего) либо `null`, если это не
 *   старое поле.
 */
function describeLegacyShape(
  trigger: EffectTrigger,
  options: EffectTriggerDescribeOptions,
): string | null {
  const kind = classifyLegacyTrigger(trigger);
  const [action] = trigger.actions;

  const timing =
    trigger.event === 'turnStart'
      ? TRIGGER_LABELS.startOfTurn
      : TRIGGER_LABELS.endOfTurn;

  if (kind === 'recurringDamage' && action?.type === 'damage') {
    const damage = describeEffectDamageParts(action.parts);

    if (!damage) {
      return '';
    }

    const { save } = trigger;

    const saveClause = save
      ? ` (${TRIGGER_LABELS.savePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[save.ability]}, ${options.formatDc(save.dc)}${TRIGGER_LABELS.damageSaveSuccess}${RECURRING_DAMAGE_SUCCESS_LABELS[action.halfOnSave ? 'half' : 'negate']})`
      : '';

    return `${TRIGGER_LABELS.everyTurnPrefix}${damage}${timing}${saveClause}`;
  }

  if (kind === 'recurringSave' && trigger.save) {
    const { ability, dc } = trigger.save;

    return `${TRIGGER_LABELS.recurringSavePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[ability]} ${options.formatDc(dc)}${timing}${TRIGGER_LABELS.recurringSaveSuffix}`;
  }

  if (kind === 'consumeOn' && trigger.role) {
    return CONSUME_ON_LABELS[trigger.role];
  }

  return null;
}

/**
 * Лимит «не чаще N раз за период».
 *
 * @param trigger срабатывание.
 * @returns продолжение фразы либо пустая строка.
 */
function describeLimit(trigger: EffectTrigger): string {
  if (!trigger.limit) {
    return '';
  }

  const { max, per } = trigger.limit;

  const times =
    max === 1 ? TRIGGER_LABELS.limitOnce : `${max}${TRIGGER_LABELS.limitTimes}`;

  return `${TRIGGER_LABELS.limitPrefix}${times}${TRIGGER_LABELS.limitPeriodPrefix}${LIMIT_PERIOD_LABELS[per]}`;
}

/**
 * Фраза срабатывания для сводки — продолжение перечисления со строчной буквы.
 *
 * @param trigger срабатывание.
 * @param options настройки.
 * @returns фраза либо пустая строка, если описывать нечего.
 */
export function describeEffectTrigger(
  trigger: EffectTrigger,
  options: EffectTriggerDescribeOptions,
): string {
  const legacy = describeLegacyShape(trigger, options);

  if (legacy !== null) {
    return legacy;
  }

  const condition = trigger.condition
    ? `${TRIGGER_LABELS.conditionPrefix}${describeTriggerCondition(trigger.condition)}`
    : '';

  const recipient =
    trigger.recipient === 'other' ? TRIGGER_LABELS.recipientOther : '';

  const moment = `${describeMoment(trigger)}${condition}${recipient}`;
  const limit = describeLimit(trigger);

  if (!trigger.save) {
    return `${moment}: ${describeOutcomeActions(trigger, false)}${limit}`;
  }

  const { ability, dc, dcFormula } = trigger.save;

  const dcLabel = dcFormula
    ? `${TRIGGER_LABELS.dcFormulaPrefix}${dcFormula.replaceAll(`@${EVENT_DAMAGE_VARIABLE}`, TRIGGER_LABELS.damageVariable)}`
    : options.formatDc(dc);

  return [
    `${moment}: ${TRIGGER_LABELS.savePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[ability]}, ${dcLabel}`,
    `${TRIGGER_LABELS.failurePrefix}${describeOutcomeActions(trigger, false)}`,
    `${TRIGGER_LABELS.successPrefix}${describeOutcomeActions(trigger, true)}${limit}`,
  ].join(TRIGGER_LABELS.clauseJoiner);
}
