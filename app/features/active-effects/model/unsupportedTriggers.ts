import type {
  EffectFormLayout,
  EffectTriggerEventSwitch,
  InertEffectField,
  UnsupportedEffectTrigger,
} from './layout';
import type { ActiveEffect } from './types';

import { upperFirst } from 'es-toolkit';

import {
  EFFECT_ACTIVATION_CHOICE_LABELS,
  EFFECT_INERT_FIELD_NAMES,
  EFFECT_INERT_FIELD_REASONS,
  EFFECT_INERT_NOTICE_LABELS,
  EFFECT_TARGET_DELIVERY_LABELS,
  EFFECT_TRIGGER_ACTION_LABELS,
  EFFECT_TRIGGER_EVENT_UNAVAILABLE_REASONS,
} from './constants';
import { explainUnsupportedEffectTrigger } from './layout';
import { describeEffectTriggerInPlace } from './scenario';

/** Строка плашки «Не работает в этом месте»: одна неработающая настройка. */
export interface InertNoticeRow {
  /** Ключ строки в списке. */
  key: string;
  /** Название настройки. */
  name: string;
  /**
   * Что именно задано, уже с разделителем после названия: склейка в шаблоне
   * дала бы лишний пробел перед двоеточием при переносе строки. Пусто —
   * хватает названия.
   */
  detail: string;
  /** Почему не работает и что включить вместо. */
  reason: string;
  /** Поле, которое сотрёт «Убрать»; у срабатывания — `null`. */
  field: InertEffectField | null;
  /** Срабатывание, которое сотрёт «Убрать»; у поля — `null`. */
  triggerId: string | null;
}

/**
 * Явные срабатывания эффекта, которые в месте формы не работают, с причиной:
 * плашка называет каждое, а не «срабатывания не для этого места».
 *
 * @param effect эффект.
 * @param layout раскладка формы.
 * @returns неработающие срабатывания в порядке списка.
 */
export function listUnsupportedEffectTriggers(
  effect: ActiveEffect,
  layout: EffectFormLayout,
): UnsupportedEffectTrigger[] {
  return (effect.triggers ?? []).flatMap((trigger) => {
    const unsupported = explainUnsupportedEffectTrigger(trigger, layout);

    return unsupported ? [unsupported] : [];
  });
}

/**
 * Убирает у эффекта одно срабатывание — из строки плашки, чтобы не сносить
 * заодно остальные неработающие. Пустой список в данных не пишется.
 *
 * @param effect эффект.
 * @param triggerId id срабатывания.
 * @returns новый эффект.
 */
export function removeEffectTrigger(
  effect: ActiveEffect,
  triggerId: string,
): ActiveEffect {
  const kept = (effect.triggers ?? []).filter(
    (trigger) => trigger.id !== triggerId,
  );

  return { ...effect, triggers: kept.length > 0 ? kept : undefined };
}

/**
 * Подпись переключателя так, как он назван в форме.
 *
 * @param eventSwitch переключатель.
 * @param layout раскладка формы.
 * @returns подпись в кавычках.
 */
function describeEventSwitch(
  eventSwitch: EffectTriggerEventSwitch,
  layout: EffectFormLayout,
): string {
  const label =
    eventSwitch === 'target'
      ? EFFECT_TARGET_DELIVERY_LABELS[layout.context]
      : EFFECT_ACTIVATION_CHOICE_LABELS[eventSwitch];

  return `${EFFECT_INERT_NOTICE_LABELS.switchQuoteOpen}${label}${EFFECT_INERT_NOTICE_LABELS.switchQuoteClose}`;
}

/**
 * Почему срабатывание не работает: момент не наступает — и что тогда
 * выбрать, — или действий здесь нет.
 *
 * @param unsupported неработающее срабатывание.
 * @param layout раскладка формы.
 * @returns причина.
 */
export function describeUnsupportedTriggerReason(
  unsupported: UnsupportedEffectTrigger,
  layout: EffectFormLayout,
): string {
  if (!unsupported.eventUnavailable) {
    const actions = unsupported.unavailableActions
      .map((actionType) => EFFECT_TRIGGER_ACTION_LABELS[actionType])
      .join(EFFECT_INERT_NOTICE_LABELS.actionsJoiner);

    return `${EFFECT_INERT_NOTICE_LABELS.actionsUnavailablePrefix}${actions}${EFFECT_INERT_NOTICE_LABELS.actionsTerminator}`;
  }

  const reason =
    EFFECT_TRIGGER_EVENT_UNAVAILABLE_REASONS[unsupported.trigger.event]
    ?? EFFECT_INERT_FIELD_REASONS.triggers;

  if (unsupported.eventSwitches.length === 0) {
    return reason;
  }

  const switches = unsupported.eventSwitches
    .map((eventSwitch) => describeEventSwitch(eventSwitch, layout))
    .join(EFFECT_INERT_NOTICE_LABELS.switchesJoiner);

  return `${reason}${EFFECT_INERT_NOTICE_LABELS.switchesPrefix}${switches}${EFFECT_INERT_NOTICE_LABELS.switchesTerminator}`;
}

/**
 * Строки плашки «Не работает в этом месте»: каждое неработающее поле и каждое
 * неработающее срабатывание — своей строкой с причиной, чтобы было понятно,
 * что сотрёт его кнопка «Убрать».
 *
 * @param fields неработающие поля эффекта.
 * @param effect эффект в форме.
 * @param layout раскладка формы.
 * @returns строки в порядке показа.
 */
export function listInertNoticeRows(
  fields: readonly InertEffectField[],
  effect: ActiveEffect,
  layout: EffectFormLayout,
): InertNoticeRow[] {
  return fields.flatMap((field): InertNoticeRow[] => {
    if (field !== 'triggers') {
      return [
        {
          key: field,
          name: upperFirst(EFFECT_INERT_FIELD_NAMES[field]),
          detail: '',
          reason: EFFECT_INERT_FIELD_REASONS[field],
          field,
          triggerId: null,
        },
      ];
    }

    return listUnsupportedEffectTriggers(effect, layout).map((unsupported) => {
      const phrase = describeEffectTriggerInPlace(
        unsupported.trigger,
        layout.context,
      );

      return {
        key: unsupported.trigger.id,
        name: EFFECT_INERT_NOTICE_LABELS.triggerName,
        detail: phrase
          ? `${EFFECT_INERT_NOTICE_LABELS.detailSeparator}${upperFirst(phrase)}`
          : '',
        reason: describeUnsupportedTriggerReason(unsupported, layout),
        field: null,
        triggerId: unsupported.trigger.id,
      };
    });
  });
}
