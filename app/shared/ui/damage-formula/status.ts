/**
 * Состояния в формуле урона: токены `@target.status.prone` и
 * `@self.status.bloodied`. Как и `@target.full`, токен — условие на своё
 * слагаемое: «1к8 + 2к6@target.status.prone» добавляет 2к6, только если цель
 * лежит ничком. Отрицаний нет: «иначе другой урон» — это урон «или» действия
 * существа, а не формула.
 *
 * Зеркало токенов состояний из `formulaTokens.ts` системы VTTG.
 */

import type { DamageFormulaStatusSide } from './constants';

import {
  DAMAGE_FORMULA_SEPARATOR,
  DAMAGE_FORMULA_STATUS_OPTIONS,
  DAMAGE_FORMULA_STATUS_SIDE_LABELS,
} from './constants';
import { buildDamageFormulaTag } from './formula';

/**
 * Токен состояния. Ключ — латиница, цифры и дефис: канон (`prone`) или своё
 * состояние мира (`marked-k3j2x9`).
 */
const DAMAGE_FORMULA_STATUS_TOKEN_PATTERN =
  /@(self|target)\.status\.([a-z0-9][a-z0-9-]*)/i;

/** Все токены состояний вместе с пробелами перед ними — для вырезания. */
const DAMAGE_FORMULA_STATUS_TOKENS_PATTERN =
  /\s*@(?:self|target)\.status\.[a-z0-9][a-z0-9-]*/gi;

/** Токен состояния, найденный в слагаемом. */
export interface DamageFormulaStatusToken {
  /** Чьё состояние. */
  side: DamageFormulaStatusSide;
  /** Ключ состояния. */
  status: string;
}

/** Названия состояний по ключу — для подписей условий. */
const DAMAGE_FORMULA_STATUS_NAMES: ReadonlyMap<string, string> = new Map(
  DAMAGE_FORMULA_STATUS_OPTIONS.map((statusOption) => [
    statusOption.value,
    statusOption.label,
  ]),
);

/**
 * Собирает токен состояния.
 *
 * @param side чьё состояние.
 * @param status ключ состояния.
 * @returns токен вида `@target.status.prone`.
 */
export function buildDamageFormulaStatusToken(
  side: DamageFormulaStatusSide,
  status: string,
): string {
  return buildDamageFormulaTag(`${side}.status.${status}`);
}

/**
 * Первый токен состояния в слагаемом.
 *
 * @param formulaTerm слагаемое или формула.
 * @returns токен; `null` — токена нет.
 */
export function readDamageFormulaStatusToken(
  formulaTerm: string,
): DamageFormulaStatusToken | null {
  const tokenMatch = DAMAGE_FORMULA_STATUS_TOKEN_PATTERN.exec(formulaTerm);

  if (!tokenMatch?.[1] || !tokenMatch[2]) {
    return null;
  }

  return {
    side: tokenMatch[1].toLowerCase() === 'self' ? 'self' : 'target',
    status: tokenMatch[2].toLowerCase(),
  };
}

/**
 * Ключ токена для отбора повторов: сторона и состояние вместе.
 *
 * @param statusToken токен состояния.
 * @returns ключ вида `self:bloodied`.
 */
function getDamageFormulaStatusTokenKey(
  statusToken: DamageFormulaStatusToken,
): string {
  return `${statusToken.side}:${statusToken.status}`;
}

/**
 * Состояния из формул — каждое один раз, в порядке первого появления. Токен
 * относится к своему слагаемому, поэтому ищется по слагаемым.
 *
 * @param formulas формулы частей урона.
 * @returns состояния сторон; пусто — состояний в формулах нет.
 */
export function listDamageFormulaStatusTokens(
  formulas: Array<string>,
): Array<DamageFormulaStatusToken> {
  const tokensByKey = new Map<string, DamageFormulaStatusToken>();

  const formulaTerms = formulas.flatMap((formula) =>
    formula.split(DAMAGE_FORMULA_SEPARATOR),
  );

  for (const formulaTerm of formulaTerms) {
    const statusToken = readDamageFormulaStatusToken(formulaTerm);

    if (statusToken) {
      tokensByKey.set(getDamageFormulaStatusTokenKey(statusToken), statusToken);
    }
  }

  return [...tokensByKey.values()];
}

/**
 * Название состояния для показа. Незнакомый ключ (состояние мира, опечатка)
 * отдаётся как есть — так опечатка видна.
 *
 * @param status ключ состояния.
 * @returns название на русском либо ключ.
 */
export function getDamageFormulaStatusName(status: string): string {
  return DAMAGE_FORMULA_STATUS_NAMES.get(status) ?? status;
}

/**
 * Пометка условия по состоянию: «цель: Лежащий ничком».
 *
 * @param statusToken токен состояния.
 * @returns сторона и название состояния.
 */
export function describeDamageFormulaStatusToken(
  statusToken: DamageFormulaStatusToken,
): string {
  return `${DAMAGE_FORMULA_STATUS_SIDE_LABELS[statusToken.side]}: ${getDamageFormulaStatusName(statusToken.status)}`;
}

/**
 * Слагаемое для показа: слагаемое по состоянию получает своё условие словами,
 * а токен снимается. Слагаемое из одного токена бросать нечего — оно
 * становится пустым.
 *
 * @param formulaTerm слагаемое формулы.
 * @returns слагаемое для показа; пустая строка — показывать нечего.
 */
function labelDamageFormulaStatusTerm(formulaTerm: string): string {
  const statusToken = readDamageFormulaStatusToken(formulaTerm);

  if (!statusToken) {
    return formulaTerm.trim();
  }

  const termWithoutStatus = formulaTerm
    .replace(DAMAGE_FORMULA_STATUS_TOKENS_PATTERN, '')
    .trim();

  return termWithoutStatus
    ? `${termWithoutStatus} (${describeDamageFormulaStatusToken(statusToken)})`
    : '';
}

/**
 * Приписывает слагаемым по состоянию их условие словами, а сам токен снимает:
 * «1к8 + 2к6@target.status.prone» → «1к8 + 2к6 (цель: Лежащий ничком)». Так
 * формулу показывает система (`formatConditionalDamageDisplay`). Прочие токены
 * не трогаются — их разбирает показывающая сторона.
 *
 * @param formula формула части урона.
 * @returns формула с подписанными слагаемыми по состоянию.
 */
export function labelDamageFormulaStatusTerms(formula: string): string {
  if (!DAMAGE_FORMULA_STATUS_TOKEN_PATTERN.test(formula)) {
    return formula;
  }

  return formula
    .split(DAMAGE_FORMULA_SEPARATOR)
    .map(labelDamageFormulaStatusTerm)
    .filter((labelledTerm) => labelledTerm.length > 0)
    .join(` ${DAMAGE_FORMULA_SEPARATOR} `);
}
