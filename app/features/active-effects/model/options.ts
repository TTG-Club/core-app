/**
 * Варианты выбора для шагов формы эффекта: подписи зависят от места формы и
 * текущей раскладки, поэтому часть из них собирается функциями, а не лежит
 * константами.
 *
 * Зеркало: dnd5-test-migrate/src/client/ui/effect/effectFormOptions.ts
 */

import type { SaveDcFieldMode } from './constants';
import type {
  EffectDelivery,
  EffectFormContext,
  EffectFormLayout,
  EffectSuccessOutcome,
} from './layout';
import type { TriggerConditionParameter } from './triggerConditions';
import type {
  EffectTrigger,
  EffectTriggerActionGate,
  EffectTriggerAttackRole,
  EffectTriggerLimitPeriod,
  EffectTriggerRecipient,
} from './triggerTypes';
import type {
  EffectAreaTrigger,
  EffectAuraTarget,
  EffectDuration,
  EffectDurationType,
  EffectTurnAnchor,
  EffectTurnTiming,
} from './types';

import {
  AURA_TRIGGER_LABELS,
  EFFECT_ACTION_SAVE_OUTCOME_OPTIONS,
  EFFECT_AURA_LABELS,
  EFFECT_CARRIER_DELIVERY_LABELS,
  EFFECT_CREATURE_CATEGORY_OPTIONS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  EFFECT_DELIVERY_ICONS,
  EFFECT_DELIVERY_LABELS,
  EFFECT_DURATION_LABELS,
  EFFECT_DURATION_STEP_LABELS,
  EFFECT_SUCCESS_OUTCOME_OPTIONS,
  EFFECT_TARGET_DELIVERY_LABELS,
  EFFECT_TRIGGER_ATTACK_OTHER_PARTY_LABELS,
  EFFECT_TRIGGER_DAMAGE_HALF_GATE,
  EFFECT_TRIGGER_DAMAGE_HALF_LABEL,
  EFFECT_TRIGGER_GATE_LABELS,
  EFFECT_TRIGGER_PERIOD_LABELS,
  EFFECT_TRIGGER_RECIPIENT_LABELS,
  EFFECT_TRIGGER_ROLE_LABELS,
  EFFECT_TURN_ANCHOR_LABELS,
  EFFECT_TURN_TIMING_LABELS,
  SAVE_DC_FIELD_MODE_LABELS,
  ZONE_TRIGGER_LABELS,
} from './constants';
import { triggerEventHasRole } from './layout';
import {
  DEFAULT_TRIGGER_ATTACK_ROLE,
  EFFECT_TRIGGER_ACTION_GATES,
  EFFECT_TRIGGER_ATTACK_ROLES,
  EFFECT_TRIGGER_LIMIT_PERIODS,
  EFFECT_TRIGGER_RECIPIENTS,
} from './triggerTypes';

/** Моменты срабатывания зоны и ауры в порядке показа. */
const EFFECT_TRIGGER_ORDER: readonly EffectAreaTrigger[] = [
  'stay',
  'enter',
  'exit',
];

/** Типы длительности в порядке показа: от частых к редким. */
const EFFECT_DURATION_TYPE_ORDER: readonly EffectDurationType[] = [
  'permanent',
  'rounds',
  'turn',
  'minutes',
  'hours',
  'days',
  'special',
];

/** Моменты хода точной длительности в порядке показа. */
const EFFECT_TURN_TIMING_ORDER: readonly EffectTurnTiming[] = ['end', 'start'];

/** Якоря хода точной длительности в порядке показа. */
const EFFECT_TURN_ANCHOR_ORDER: readonly EffectTurnAnchor[] = [
  'carrier',
  'source',
];

/** Длительности, у которых есть число единиц. */
const COUNTED_DURATION_TYPES: ReadonlySet<EffectDurationType> = new Set([
  'rounds',
  'minutes',
  'hours',
  'days',
]);

/** Вариант выбора. */
export interface EffectSegmentOption<Value extends string> {
  /** Значение варианта. */
  value: Value;
  /** Подпись. */
  label: string;
  /** Иконка. */
  icon?: string;
}

/** Вариант выбора с пояснением. */
export interface EffectDescribedOption<Value extends string> {
  /** Значение варианта. */
  value: Value;
  /** Подпись. */
  label: string;
  /** Пояснение под подписью. */
  description: string;
}

/**
 * Подпись доставки в месте формы.
 *
 * @param delivery доставка.
 * @param context место формы.
 * @returns подпись.
 */
function deliveryLabel(
  delivery: EffectDelivery,
  context: EffectFormContext,
): string {
  switch (delivery) {
    case 'carrier':
      return EFFECT_CARRIER_DELIVERY_LABELS[context];
    case 'target':
      return EFFECT_TARGET_DELIVERY_LABELS[context];
    case 'aura':
      return EFFECT_DELIVERY_LABELS.aura;
    case 'zone':
    default:
      return context === 'spell'
        ? EFFECT_DELIVERY_LABELS.spellZone
        : EFFECT_DELIVERY_LABELS.zone;
  }
}

/**
 * Варианты «на кого» для места формы.
 *
 * @param layout раскладка формы.
 * @returns варианты в порядке раскладки.
 */
export function buildDeliveryOptions(
  layout: EffectFormLayout,
): EffectSegmentOption<EffectDelivery>[] {
  return layout.deliveryOptions.map((delivery) => ({
    value: delivery,
    label: deliveryLabel(delivery, layout.context),
    icon: EFFECT_DELIVERY_ICONS[delivery],
  }));
}

/**
 * Варианты момента срабатывания: у зоны и ауры подписи свои.
 *
 * @param delivery доставка.
 * @returns варианты.
 */
export function buildTriggerOptions(
  delivery: EffectDelivery,
): EffectSegmentOption<EffectAreaTrigger>[] {
  const labels =
    delivery === 'aura' ? AURA_TRIGGER_LABELS : ZONE_TRIGGER_LABELS;

  return EFFECT_TRIGGER_ORDER.map((trigger) => ({
    value: trigger,
    label: labels[trigger],
  }));
}

/**
 * Сужает значение переключателя до момента срабатывания.
 *
 * @param value значение из переключателя.
 * @returns момент либо `undefined` для чужого значения.
 */
export function findTrigger(
  value: string | number,
): EffectAreaTrigger | undefined {
  return EFFECT_TRIGGER_ORDER.find((trigger) => trigger === value);
}

/**
 * Варианты «при успехе» для раскладки.
 *
 * @param layout раскладка формы.
 * @returns варианты с пояснениями.
 */
export function buildSuccessOutcomeOptions(
  layout: EffectFormLayout,
): EffectDescribedOption<EffectSuccessOutcome>[] {
  const options = layout.successOutcomeForActionSave
    ? EFFECT_ACTION_SAVE_OUTCOME_OPTIONS
    : EFFECT_SUCCESS_OUTCOME_OPTIONS;

  return layout.successOutcomes.map((outcome) => ({
    value: outcome,
    ...options[outcome],
  }));
}

/**
 * Есть ли у длительности число единиц.
 *
 * @param type тип длительности.
 * @returns `true` для раундов, минут, часов и дней.
 */
export function isCountedDuration(type: EffectDurationType): boolean {
  return COUNTED_DURATION_TYPES.has(type);
}

/**
 * Пояснение под выбором длительности.
 *
 * @param type тип длительности.
 * @returns пояснение.
 */
export function durationHint(type: EffectDurationType): string {
  switch (type) {
    case 'permanent':
      return EFFECT_DURATION_STEP_LABELS.permanentHint;
    case 'rounds':
      return EFFECT_DURATION_STEP_LABELS.roundsHint;
    case 'turn':
      return EFFECT_DURATION_STEP_LABELS.turnHint;
    case 'special':
      return EFFECT_DURATION_STEP_LABELS.specialHint;
    default:
      return EFFECT_DURATION_STEP_LABELS.timeHint;
  }
}

/** Варианты типа длительности. */
export const EFFECT_DURATION_TYPE_OPTIONS: Array<
  EffectSegmentOption<EffectDurationType>
> = EFFECT_DURATION_TYPE_ORDER.map((type) => ({
  value: type,
  label: EFFECT_DURATION_LABELS[type],
}));

/** Варианты момента хода точной длительности. */
export const EFFECT_TURN_TIMING_OPTIONS: Array<
  EffectSegmentOption<EffectTurnTiming>
> = EFFECT_TURN_TIMING_ORDER.map((timing) => ({
  value: timing,
  label: EFFECT_TURN_TIMING_LABELS[timing],
}));

/** Варианты якоря хода точной длительности. */
export const EFFECT_TURN_ANCHOR_OPTIONS: Array<
  EffectSegmentOption<EffectTurnAnchor>
> = EFFECT_TURN_ANCHOR_ORDER.map((anchor) => ({
  value: anchor,
  label: EFFECT_TURN_ANCHOR_LABELS[anchor],
}));

/**
 * Меняет тип длительности. Число единиц переносится между раундами, минутами,
 * часами и днями; момент и якорь хода нужны только точной длительности.
 *
 * @param duration длительность.
 * @param type новый тип.
 * @returns новая длительность.
 */
export function writeDurationType(
  duration: EffectDuration,
  type: EffectDurationType,
): EffectDuration {
  return {
    type,
    value: isCountedDuration(type) ? duration.value : undefined,
    turnAnchor: type === 'turn' ? duration.turnAnchor : undefined,
    turnTiming: type === 'turn' ? duration.turnTiming : undefined,
  };
}

/** Варианты «кого задевает аура». */
export const EFFECT_AURA_TARGET_OPTIONS: Array<
  EffectSegmentOption<EffectAuraTarget>
> = [
  { value: 'allies', label: EFFECT_AURA_LABELS.targetAllies },
  { value: 'enemies', label: EFFECT_AURA_LABELS.targetEnemies },
  { value: 'all', label: EFFECT_AURA_LABELS.targetAll },
];

/** Режимы поля Сл: Сл источника или своё число. */
export const SAVE_DC_FIELD_MODE_OPTIONS: Array<
  EffectSegmentOption<SaveDcFieldMode>
> = [
  { value: 'auto', label: SAVE_DC_FIELD_MODE_LABELS.auto },
  { value: 'manual', label: SAVE_DC_FIELD_MODE_LABELS.manual },
];

/** Исход урона в строке срабатывания: гейт либо «успех — половина». */
export type EffectTriggerDamageGateChoice =
  | EffectTriggerActionGate
  | typeof EFFECT_TRIGGER_DAMAGE_HALF_GATE;

/** Варианты роли субъекта в броске атаки. */
export const EFFECT_TRIGGER_ROLE_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerAttackRole>
> = EFFECT_TRIGGER_ATTACK_ROLES.map((attackRole) => ({
  value: attackRole,
  label: EFFECT_TRIGGER_ROLE_LABELS[attackRole],
}));

/**
 * Варианты получателя действий срабатывания. «Другая сторона» подписана по
 * событию: у урона — кто его нанёс, у броска атаки — цель или атакующий.
 *
 * @param trigger событие и роль строки.
 * @returns варианты.
 */
export function buildTriggerRecipientOptions(
  trigger: Pick<EffectTrigger, 'event' | 'role'>,
): EffectSegmentOption<EffectTriggerRecipient>[] {
  const labels: Record<EffectTriggerRecipient, string> = triggerEventHasRole(
    trigger.event,
  )
    ? {
        ...EFFECT_TRIGGER_RECIPIENT_LABELS,
        other:
          EFFECT_TRIGGER_ATTACK_OTHER_PARTY_LABELS[
            trigger.role ?? DEFAULT_TRIGGER_ATTACK_ROLE
          ],
      }
    : EFFECT_TRIGGER_RECIPIENT_LABELS;

  return EFFECT_TRIGGER_RECIPIENTS.map((recipient) => ({
    value: recipient,
    label: labels[recipient],
  }));
}

/** Варианты периода лимита. */
export const EFFECT_TRIGGER_PERIOD_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerLimitPeriod>
> = EFFECT_TRIGGER_LIMIT_PERIODS.map((period) => ({
  value: period,
  label: EFFECT_TRIGGER_PERIOD_LABELS[period],
}));

/** Варианты исхода действия относительно спасброска. */
export const EFFECT_TRIGGER_GATE_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerActionGate>
> = EFFECT_TRIGGER_ACTION_GATES.map((gate) => ({
  value: gate,
  label: EFFECT_TRIGGER_GATE_LABELS[gate],
}));

/** Варианты исхода урона: «успех — половина» — отдельный вариант. */
export const EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS: Array<
  EffectSegmentOption<EffectTriggerDamageGateChoice>
> = [
  { value: 'failed', label: EFFECT_TRIGGER_GATE_LABELS.failed },
  {
    value: EFFECT_TRIGGER_DAMAGE_HALF_GATE,
    label: EFFECT_TRIGGER_DAMAGE_HALF_LABEL,
  },
  { value: 'always', label: EFFECT_TRIGGER_GATE_LABELS.always },
  { value: 'saved', label: EFFECT_TRIGGER_GATE_LABELS.saved },
];

/**
 * Варианты значения части условия по тому, что выбирается: тип урона или тип
 * существа. Ключ отметки вводится строкой, и вариантов у него нет.
 */
export const EFFECT_TRIGGER_CONDITION_VALUE_OPTIONS: Record<
  Exclude<TriggerConditionParameter, 'tag'>,
  Array<{ label: string; value: string }>
> = {
  damageType: EFFECT_DAMAGE_TYPE_OPTIONS,
  creatureType: EFFECT_CREATURE_CATEGORY_OPTIONS,
};
