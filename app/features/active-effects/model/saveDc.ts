/**
 * Сл спасброска эффекта формулой — один обход для всех полей Сл.
 *
 * Сл умения, которое не колдует, — «8 + бонус мастерства + модификатор
 * характеристики» ВЛАДЕЛЬЦА эффекта; Сл ауры умения — «Сл ваших заклинаний».
 * Число такую Сл не выражает: оно не растёт с уровнем. Поэтому у каждого
 * спасброска эффекта (при наложении, повторного, против урона каждый ход,
 * срабатывания, проверки «вырваться») рядом с числом `dc` может лежать формула
 * `dcFormula`. Число остаётся запасным: формулу с ошибкой VTTG бросает против
 * него.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectSaveDc.ts
 */

import type {
  EffectTrigger,
  EffectTriggerAction,
  NestedEffectTrigger,
  NestedEffectTriggerAction,
} from './triggerTypes';
import type { ActiveEffect } from './types';

import {
  EFFECT_SAVE_DC_FORMULA_ERRORS,
  EFFECT_SAVE_DC_FORMULA_LABELS,
  EVENT_DAMAGE_VARIABLE,
} from './constants';
import { validateFormula } from './formula';

/** Сл спасброска: число и необязательная формула. */
export interface SaveDcSource {
  /** Сл числом; при формуле — запасное число. */
  dc: number;
  /** Сл формулой по владельцу эффекта. */
  dcFormula?: string;
}

/** Самая длинная формула Сл. */
export const MAX_SAVE_DC_FORMULA_LENGTH = 200;

/** Токен урона события в записи формулы. */
const EVENT_DAMAGE_TOKEN = `@${EVENT_DAMAGE_VARIABLE}`;

/** Что допускает поле Сл формулой в своём месте. */
export interface SaveDcFormulaRules {
  /** Есть ли у события урон — токен `@damage`. */
  acceptsDamage: boolean;
}

/**
 * Ошибка формулы Сл для поля формы: синтаксис и `@damage` вне события урона.
 *
 * @param formula формула из поля.
 * @param rules что допускает место.
 * @returns текст ошибки либо `undefined`, если формула годится.
 */
export function describeSaveDcFormulaError(
  formula: string,
  rules: SaveDcFormulaRules,
): string | undefined {
  const { error } = validateFormula(formula);

  if (error) {
    return error;
  }

  return !rules.acceptsDamage && formula.includes(EVENT_DAMAGE_TOKEN)
    ? EFFECT_SAVE_DC_FORMULA_ERRORS.damageOutsideEvent
    : undefined;
}

/**
 * Подсказка под полем Сл формулой: какие токены считаются, а у события урона
 * — ещё `@damage`.
 *
 * @param rules что допускает место.
 * @returns текст подсказки.
 */
export function describeSaveDcFormulaHelp(rules: SaveDcFormulaRules): string {
  return rules.acceptsDamage
    ? `${EFFECT_SAVE_DC_FORMULA_LABELS.hint}${EFFECT_SAVE_DC_FORMULA_LABELS.damageHint}`
    : EFFECT_SAVE_DC_FORMULA_LABELS.hint;
}

/**
 * Читает ли формула Сл урон события.
 *
 * @param formula формула Сл.
 * @returns `true`, если в формуле есть `@damage`.
 */
export function saveDcFormulaReadsDamage(formula: string | undefined): boolean {
  return formula?.includes(EVENT_DAMAGE_TOKEN) === true;
}

/** Что сделать с одной Сл эффекта; вид спасброска сохраняется. */
export type SaveDcMapper = <Save extends SaveDcSource>(save: Save) => Save;

/**
 * Действие срабатывания с изменёнными Сл наложенного им состояния.
 *
 * @param action действие.
 * @param mapSave что сделать с Сл.
 * @returns действие с новыми Сл.
 */
function mapActionSaveDcs<
  Action extends EffectTriggerAction | NestedEffectTriggerAction,
>(action: Action, mapSave: SaveDcMapper): Action {
  if (action.type !== 'applyCondition') {
    return action;
  }

  return {
    ...action,
    ...(action.recurringSave
      ? { recurringSave: mapSave(action.recurringSave) }
      : {}),
    // «Вырваться» наложенного состояния — та же Сл источника, что у спасброска
    ...(action.escape?.check
      ? { escape: { ...action.escape, check: mapSave(action.escape.check) } }
      : {}),
    ...('triggers' in action && action.triggers
      ? {
          triggers: action.triggers.map((nestedTrigger) =>
            mapTriggerSaveDcs(nestedTrigger, mapSave),
          ),
        }
      : {}),
  };
}

/**
 * Срабатывание с изменёнными Сл: своя и у повторного спасброска наложенного
 * состояния вместе с его вложенными срабатываниями.
 *
 * @param trigger срабатывание.
 * @param mapSave что сделать с Сл.
 * @returns срабатывание с новыми Сл.
 */
function mapTriggerSaveDcs<Trigger extends EffectTrigger | NestedEffectTrigger>(
  trigger: Trigger,
  mapSave: SaveDcMapper,
): Trigger {
  return {
    ...trigger,
    ...(trigger.save ? { save: mapSave(trigger.save) } : {}),
    actions: trigger.actions.map((action) => mapActionSaveDcs(action, mapSave)),
  };
}

/**
 * Все Сл эффекта одним обходом: при наложении, повторный спасбросок, против
 * урона каждый ход, проверка «вырваться», спасбросок правила каста,
 * срабатывания и наложенные ими состояния. Новое поле Сл добавляется сюда — и
 * доходит до записи сразу.
 *
 * @param effect эффект.
 * @param mapSave что сделать с каждой Сл.
 * @returns копия эффекта с новыми Сл.
 */
export function mapEffectSaveDcs(
  effect: ActiveEffect,
  mapSave: SaveDcMapper,
): ActiveEffect {
  const {
    applySave,
    recurringSave,
    recurringDamage,
    escape,
    castRule,
    triggers,
  } = effect;

  return {
    ...effect,
    ...(applySave ? { applySave: mapSave(applySave) } : {}),
    ...(recurringSave ? { recurringSave: mapSave(recurringSave) } : {}),
    ...(recurringDamage?.save
      ? {
          recurringDamage: {
            ...recurringDamage,
            save: mapSave(recurringDamage.save),
          },
        }
      : {}),
    ...(escape?.check
      ? { escape: { ...escape, check: mapSave(escape.check) } }
      : {}),
    // Спасбросок при попытке каста — Сл наложившего, как у повторного
    ...(castRule?.failSave
      ? { castRule: { ...castRule, failSave: mapSave(castRule.failSave) } }
      : {}),
    ...(triggers
      ? {
          triggers: triggers.map((trigger) =>
            mapTriggerSaveDcs(trigger, mapSave),
          ),
        }
      : {}),
  };
}

/**
 * Сл с формулой к записи: пустая формула — её отсутствие, спасбросок остаётся
 * с числом.
 *
 * @param save Сл из формы.
 * @returns Сл без пустой формулы.
 */
export function trimSaveDcFormula<Save extends SaveDcSource>(save: Save): Save {
  return { ...save, dcFormula: save.dcFormula?.trim() || undefined };
}
