/**
 * Правило каста у эффекта: что мешает носителю накладывать заклинания, пока
 * эффект на нём.
 *
 * Запрет «нельзя вовсе», «нельзя с вербальным компонентом», «нельзя действием
 * Магия», «нельзя школу» — флаги: у них нет чисел. Здесь — правила с числами:
 * - круг ячейки: «не может использовать ячейки 7-го круга и выше»
 *   (`maxSlotLevel: 6`), «…ниже 3-го» (`minSlotLevel: 3`);
 * - провал каста: шанс («Замедление»: 25 %, если у заклинания соматический
 *   компонент) или спасбросок заклинателя («Слово силы: Боль»: Телосложение,
 *   иначе заклинание рассеивается).
 *
 * Здесь форма данных и её запись из формы; проверяет каст сам VTTG.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectCastRuleTypes.ts
 */

import type { SaveDcSource } from './saveDc';
import type { EffectAbility } from './types';

import { clamp } from 'es-toolkit';

import { MAX_SPELL_SLOT_LEVEL, MIN_SPELL_SLOT_LEVEL } from './triggerTypes';
import { parseFormNumber } from './types';

/** Компоненты заклинания, по которым правило отбирает касты. */
export const CAST_RULE_COMPONENTS = ['verbal', 'somatic', 'material'] as const;

/** Компонент заклинания, по которому правило отбирает касты. */
export type CastRuleComponent = (typeof CAST_RULE_COMPONENTS)[number];

/** Спасбросок заклинателя при попытке каста. */
export interface CastRuleSave extends SaveDcSource {
  /** Характеристика спасброска. */
  ability: EffectAbility;
}

/** Правило каста у эффекта. */
export interface EffectCastRule {
  /**
   * Самый высокий круг ячейки, которую носитель может потратить: «не может
   * использовать ячейки 7-го круга и выше» — 6. Заговоры и заклинания без
   * ячеек (с зарядами) правило не трогает.
   */
  maxSlotLevel?: number;
  /** Самый низкий круг ячейки, которую носитель может потратить. */
  minSlotLevel?: number;
  /** Шанс провала каста в процентах (1–100): «вероятность 25 %». */
  failChance?: number;
  /** Спасбросок заклинателя при попытке каста: провал — заклинание не удалось. */
  failSave?: CastRuleSave;
  /**
   * Только заклинания с этим компонентом проверяют провал: «с соматическим
   * компонентом». Нет поля — любое заклинание.
   */
  failComponent?: CastRuleComponent;
  /**
   * Ячейка при провале тратится («заклинание проваливается» по общему
   * правилу). Нет поля — потрачено только действие («Слово силы: Боль»).
   */
  failLosesSlot?: true;
}

/** Самый малый шанс провала: нулевой шанс — правила нет. */
export const MIN_CAST_FAIL_CHANCE = 1;

/** Самый большой шанс провала — наверняка. */
export const MAX_CAST_FAIL_CHANCE = 100;

/** Характеристика спасброска нового правила: Телосложение — самая частая. */
export const NEW_CAST_RULE_SAVE_ABILITY: EffectAbility = 'constitution';

/**
 * Есть ли у правила провал каста: без него отбор по компоненту и судьба ячейки
 * ничего не значат.
 *
 * @param rule правило каста.
 * @returns `true`, если задан шанс провала или спасбросок.
 */
export function castRuleHasFailure(rule: EffectCastRule): boolean {
  return rule.failChance !== undefined || rule.failSave !== undefined;
}

/**
 * Есть ли в правиле хоть что-то: пустое правило в данные не пишется.
 *
 * @param rule правило каста.
 * @returns `true`, если правило что-то задаёт.
 */
export function hasCastRuleContent(rule: EffectCastRule): boolean {
  return (
    rule.maxSlotLevel !== undefined
    || rule.minSlotLevel !== undefined
    || castRuleHasFailure(rule)
  );
}

/**
 * Целое число правила из поля формы в своих пределах.
 *
 * @param enteredNumber значение поля; пустое — числа нет.
 * @param min наименьшее допустимое.
 * @param max наибольшее допустимое.
 * @returns число либо `undefined` для пустого поля.
 */
function toCastRuleNumber(
  enteredNumber: unknown,
  min: number,
  max: number,
): number | undefined {
  const parsedNumber = parseFormNumber(enteredNumber);

  return parsedNumber === undefined
    ? undefined
    : clamp(Math.trunc(parsedNumber), min, max);
}

/**
 * Правило каста для записи: числа — целыми в своих пределах, отбор по
 * компоненту и трата ячейки — только вместе с провалом, пустое правило —
 * отсутствием поля.
 *
 * @param rule правило из черновика.
 * @returns правило либо `undefined`.
 */
export function normalizeDraftCastRule(
  rule: EffectCastRule | undefined,
): EffectCastRule | undefined {
  if (!rule) {
    return undefined;
  }

  const hasFailure = castRuleHasFailure(rule);

  const normalizedRule: EffectCastRule = {
    maxSlotLevel: toCastRuleNumber(
      rule.maxSlotLevel,
      MIN_SPELL_SLOT_LEVEL,
      MAX_SPELL_SLOT_LEVEL,
    ),
    minSlotLevel: toCastRuleNumber(
      rule.minSlotLevel,
      MIN_SPELL_SLOT_LEVEL,
      MAX_SPELL_SLOT_LEVEL,
    ),
    failChance: toCastRuleNumber(
      rule.failChance,
      MIN_CAST_FAIL_CHANCE,
      MAX_CAST_FAIL_CHANCE,
    ),
    failSave: rule.failSave,
    failComponent: hasFailure ? rule.failComponent : undefined,
    failLosesSlot: hasFailure && rule.failLosesSlot ? true : undefined,
  };

  return hasCastRuleContent(normalizedRule) ? normalizedRule : undefined;
}
