/**
 * Живая сводка эффекта: одна-две фразы «что произойдёт» простыми словами.
 *
 * Сводка стоит в форме эффекта над всеми шагами и пересобирается на каждое
 * изменение: автор сразу видит, что собрал — «При входе в ауру: спасбросок
 * Телосложения, Сл 13. Провал — 2к6 ядом, «Отравленный», на 1 минуту. Успех —
 * половина урона». В отличие от `describeActiveEffect`, фраза знает МЕСТО
 * эффекта (заклинание, оружие, черта) и порядок событий: когда, какой
 * спасбросок, что при провале и что при успехе.
 *
 * Зеркало: dnd5-test-migrate/src/engine/activeEffectScenario.ts
 */

import type { EffectConditionTemplate } from './constants';
import type { EffectFormContext, EffectFormLayout } from './layout';
import type { EffectTrigger } from './triggerTypes';
import type { ActiveEffect, EffectChange } from './types';

import {
  EFFECT_ABILITY_GENITIVE_LABELS,
  EFFECT_AURA_MOMENT_PREFIXES,
  EFFECT_AURA_TARGET_SCENARIO_LABELS,
  EFFECT_CARRIER_MOMENT_LABELS,
  EFFECT_PHRASE_PARTS,
  EFFECT_SCENARIO_APPLIER_DC_LABELS,
  EFFECT_SCENARIO_LABELS,
  EFFECT_SCENARIO_MAX_NAMED_MODIFIERS,
  EFFECT_SPELL_ZONE_MOMENT_LABELS,
  EFFECT_TARGET_MOMENT_LABELS,
  EFFECT_ZONE_MOMENT_LABELS,
} from './constants';
import { findEffectConditionTemplate } from './create';
import {
  describeConditionName,
  describeEffectChange,
  describeEffectDamageParts,
  describeEffectDuration,
  describeEffectFlag,
  formatEffectSaveDc,
} from './describe';
import {
  APPLIER_SAVE_DC,
  readEffectSuccessOutcome,
  resolveEffectFormLayout,
} from './layout';
import { describeEffectTrigger } from './triggerDescribe';
import { listEffectListTriggers } from './triggers';
import { LEGACY_TRIGGER_IDS } from './triggerTypes';

/** Что состояние уже делает само: это сводка не перечисляет. */
type ConditionPayload = Pick<
  EffectConditionTemplate,
  'changes' | 'flags' | 'conditionImmunities'
>;

/**
 * Подпись Сл спасброска в сводке.
 *
 * @param dc сложность из эффекта.
 * @param context место формы.
 * @returns подпись сложности.
 */
function formatScenarioSaveDc(dc: number, context: EffectFormContext): string {
  const applierLabel = EFFECT_SCENARIO_APPLIER_DC_LABELS[context];

  return dc === APPLIER_SAVE_DC && applierLabel
    ? applierLabel
    : formatEffectSaveDc(dc);
}

/**
 * Когда срабатывает эффект.
 *
 * @param effect эффект.
 * @param layout раскладка формы.
 * @returns начало фразы.
 */
function describeMoment(
  effect: ActiveEffect,
  layout: EffectFormLayout,
): string {
  switch (layout.delivery) {
    case 'zone':
      return layout.context === 'spell'
        ? EFFECT_SPELL_ZONE_MOMENT_LABELS[layout.trigger]
        : EFFECT_ZONE_MOMENT_LABELS[layout.trigger];
    case 'target':
      return EFFECT_TARGET_MOMENT_LABELS[layout.context];
    case 'aura': {
      if (!effect.aura) {
        return EFFECT_CARRIER_MOMENT_LABELS[layout.context];
      }

      return `${EFFECT_AURA_MOMENT_PREFIXES[layout.trigger]}${effect.aura.radius}${EFFECT_PHRASE_PARTS.feetSuffix} (${EFFECT_AURA_TARGET_SCENARIO_LABELS[effect.aura.target]})`;
    }
    case 'carrier':
    default:
      return EFFECT_CARRIER_MOMENT_LABELS[layout.context];
  }
}

/**
 * Что делает состояние, которым эффект считается, — чтобы не перечислять то,
 * что уже сказано его названием: «Отравленный» и так значит помеху на атаки.
 * Берётся из шаблона: сводка пересобирается на каждое изменение и не должна
 * собирать эффект с новым ключом.
 *
 * @param effect эффект.
 * @returns модификаторы, флаги и иммунитеты состояния либо `null`, если эффект
 *   состоянием не считается или шаблона у состояния нет.
 */
function conditionPayloadOf(effect: ActiveEffect): ConditionPayload | null {
  if (!effect.conditionKey) {
    return null;
  }

  return findEffectConditionTemplate(effect.conditionKey) ?? null;
}

/**
 * Совпадают ли строки модификаторов по смыслу.
 *
 * @param left строка.
 * @param right строка.
 * @returns `true`, если ключ, режим, значение и условие одни и те же.
 */
function isSameChange(left: EffectChange, right: EffectChange): boolean {
  return (
    left.key === right.key
    && left.mode === right.mode
    && left.value === right.value
    && (left.condition ?? '') === (right.condition ?? '')
  );
}

/**
 * Называет модификаторы и флаги сверх состояния: первые поимённо, остальные
 * числом.
 *
 * @param effect эффект.
 * @param condition что делает состояние, которым эффект считается.
 * @returns подписи.
 */
function describeModifiers(
  effect: ActiveEffect,
  condition: ConditionPayload | null,
): string[] {
  const ownChanges = effect.changes.filter(
    (change) =>
      change.key !== ''
      && change.value.trim() !== ''
      && !condition?.changes.some((conditionChange) =>
        isSameChange(conditionChange, change),
      ),
  );

  const ownFlags = effect.flags.filter(
    (flag) => !condition?.flags.includes(flag),
  );

  const named = [
    ...ownChanges.map(describeEffectChange),
    ...ownFlags.map(describeEffectFlag),
  ];

  if (named.length <= EFFECT_SCENARIO_MAX_NAMED_MODIFIERS) {
    return named;
  }

  const hiddenCount = named.length - EFFECT_SCENARIO_MAX_NAMED_MODIFIERS;

  return [
    ...named.slice(0, EFFECT_SCENARIO_MAX_NAMED_MODIFIERS),
    `${EFFECT_SCENARIO_LABELS.more} ${hiddenCount}`,
  ];
}

/**
 * Показывается ли срабатывание в сводке этого места: старые поля — там, где их
 * шаг работает, явные срабатывания — всегда.
 *
 * @param trigger срабатывание.
 * @param layout раскладка формы.
 * @returns `true`, если срабатывание описывается.
 */
function isTriggerShown(
  trigger: EffectTrigger,
  layout: EffectFormLayout,
): boolean {
  switch (trigger.id) {
    case LEGACY_TRIGGER_IDS.recurringDamage:
      return layout.showRecurringDamage;
    case LEGACY_TRIGGER_IDS.recurringSave:
      return layout.showRecurringSave;
    case LEGACY_TRIGGER_IDS.consumeOn:
      return layout.showConsumeOn;
    default:
      return true;
  }
}

/**
 * Что эффект оставляет на том, на кого лёг: состояние, модификаторы, периодику
 * и сроки. Урон срабатывания сюда не входит — он зависит от спасброска иначе.
 *
 * @param effect эффект.
 * @param layout раскладка формы.
 * @returns части фразы.
 */
function describeLastingPayload(
  effect: ActiveEffect,
  layout: EffectFormLayout,
): string[] {
  const parts: string[] = [];
  const condition = conditionPayloadOf(effect);

  if (effect.conditionKey) {
    parts.push(`«${describeConditionName(effect.conditionKey)}»`);
  }

  parts.push(...describeModifiers(effect, condition));

  const ownImmunities = (effect.conditionImmunities ?? []).filter(
    (immunity) => !condition?.conditionImmunities?.includes(immunity),
  );

  if (layout.showConditionImmunities && ownImmunities.length > 0) {
    parts.push(
      `${EFFECT_PHRASE_PARTS.immunitiesPrefix}${ownImmunities
        .map(describeConditionName)
        .join(EFFECT_PHRASE_PARTS.listJoiner)}`,
    );
  }

  for (const trigger of listEffectListTriggers(effect)) {
    if (!isTriggerShown(trigger, layout)) {
      continue;
    }

    const phrase = describeEffectTrigger(trigger, {
      formatDc: (dc) => formatScenarioSaveDc(dc, layout.context),
    });

    if (phrase) {
      parts.push(phrase);
    }
  }

  const duration =
    layout.showDuration && effect.duration.type !== 'permanent'
      ? describeEffectDuration(effect.duration)
      : null;

  if (duration && parts.length > 0) {
    parts.push(duration);
  }

  return parts;
}

/**
 * Склеивает части в перечисление.
 *
 * @param parts части.
 * @returns перечисление либо «ничего».
 */
function joinParts(parts: readonly string[]): string {
  return parts.length > 0
    ? parts.join(EFFECT_PHRASE_PARTS.listJoiner)
    : EFFECT_PHRASE_PARTS.nothing;
}

/**
 * Что даёт успешный спасбросок эффекта.
 *
 * @param effect эффект.
 * @param damage подпись урона срабатывания (пусто — урона нет).
 * @param lasting длящаяся нагрузка.
 * @returns фраза исхода.
 */
function describeSuccess(
  effect: ActiveEffect,
  damage: string,
  lasting: readonly string[],
): string {
  switch (readEffectSuccessOutcome(effect)) {
    case 'halfDamage':
      return EFFECT_PHRASE_PARTS.halfDamage;
    case 'halfDamageWithEffect':
      return `${EFFECT_PHRASE_PARTS.halfDamage}${EFFECT_PHRASE_PARTS.andJoiner}${joinParts(lasting)}`;
    case 'effectWithoutDamage':
      return joinParts(lasting);
    case 'onlyOnSuccess':
      return joinParts(damage ? [damage, ...lasting] : lasting);
    case 'nothing':
    default:
      return EFFECT_PHRASE_PARTS.nothing;
  }
}

/**
 * Живая сводка эффекта для формы: когда срабатывает, какой спасбросок, что при
 * провале и что при успехе — в той форме, в какой эффект сработает там, откуда
 * открыта форма.
 *
 * @param effect эффект в форме.
 * @param context место формы.
 * @returns одна-две фразы.
 */
export function describeEffectScenario(
  effect: ActiveEffect,
  context: EffectFormContext,
): string {
  const layout = resolveEffectFormLayout(context, effect);
  const moment = describeMoment(effect, layout);
  const lasting = describeLastingPayload(effect, layout);

  const damage =
    layout.showTriggerDamage && effect.damageParts?.length
      ? describeEffectDamageParts(effect.damageParts)
      : '';

  const failurePayload = damage ? [damage, ...lasting] : lasting;

  if (layout.showSave && effect.applySave) {
    const { ability, dc } = effect.applySave;
    const outcome = readEffectSuccessOutcome(effect);

    const failure =
      outcome === 'onlyOnSuccess'
        ? EFFECT_PHRASE_PARTS.nothing
        : joinParts(failurePayload);

    return [
      `${moment}: ${EFFECT_PHRASE_PARTS.savePrefix}${EFFECT_ABILITY_GENITIVE_LABELS[ability]}, ${formatScenarioSaveDc(dc, context)}.`,
      `${EFFECT_SCENARIO_LABELS.failurePrefix}${failure}.`,
      `${EFFECT_SCENARIO_LABELS.successPrefix}${describeSuccess(effect, damage, lasting)}.`,
    ].join(' ');
  }

  if (failurePayload.length === 0) {
    return `${moment}: ${EFFECT_SCENARIO_LABELS.emptyEffect}.`;
  }

  if (layout.successOutcomeForActionSave) {
    switch (readEffectSuccessOutcome(effect)) {
      case 'onlyOnSuccess':
        return `${moment}${EFFECT_SCENARIO_LABELS.actionSaveOnlyOnSuccess}: ${joinParts(failurePayload)}.`;
      case 'effectWithoutDamage':
      case 'halfDamageWithEffect':
        return `${moment}: ${joinParts(failurePayload)}. ${EFFECT_SCENARIO_LABELS.actionSaveEffectAnyway}`;
      default:
        break;
    }
  }

  return `${moment}: ${joinParts(failurePayload)}.`;
}
