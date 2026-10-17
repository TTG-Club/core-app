import type {
  BastionActivityOrder,
  BastionOrderCode,
  FacilityOrderOptionDetail,
  FacilitySpaceCode,
} from './schema';

import { fillTemplate } from '~bastions/model';

import {
  ACTIVITY_LABELS,
  BASIC_BUILD_TERMS,
  DAYS_PER_TURN,
  DEFENSE_WALL_COST_PER_SQUARE,
  DEFENSE_WALL_DAYS_PER_SQUARE,
  DEFENSE_WALL_LABELS,
  TURN_FORMS,
  TURNS_LEFT_LABELS,
} from './activity-constants';
import { BASTION_ORDERS } from './schema';

const ORDER_CODES: ReadonlySet<string> = new Set(BASTION_ORDERS);

/**
 * Проверяет, что код приказа — известный приказ бастиона.
 *
 * @param value Код из ответа сервера.
 * @returns true для известного кода.
 */
export function isBastionOrderCode(value: string): value is BastionOrderCode {
  return ORDER_CODES.has(value);
}

/**
 * Сколько ходов займёт дело на столько-то дней — как считает сервер.
 *
 * @param days Дни; пусто — один ход.
 * @returns Число ходов, не меньше одного.
 */
export function getTurnsFor(days: number | null | undefined): number {
  return days && days > 0 ? Math.ceil(days / DAYS_PER_TURN) : 1;
}

/**
 * Сколько ходов осталось до хода, на котором дело закончится. Дело
 * завершается при переходе на этот ход, поэтому на текущем ходу остаётся
 * хотя бы один.
 *
 * @param readyOnTurn Ход, на котором дело закончится.
 * @param currentTurn Текущий ход бастиона.
 * @returns Число ходов, не меньше одного.
 */
export function getTurnsLeft(readyOnTurn: number, currentTurn: number): number {
  return Math.max(1, readyOnTurn - currentTurn);
}

/**
 * Подпись «осталось 3 хода» или «остался 1 ход».
 *
 * @param readyOnTurn Ход, на котором дело закончится; пусто — срок неизвестен.
 * @param currentTurn Текущий ход бастиона.
 * @returns Подпись или прочерк, если срока нет.
 */
export function getTurnsLeftText(
  readyOnTurn: number | null | undefined,
  currentTurn: number | null | undefined,
): string {
  if (readyOnTurn == null || currentTurn == null) {
    return '—';
  }

  const count = getTurnsLeft(readyOnTurn, currentTurn);
  const turns = getPlural(count, TURN_FORMS);

  return fillTemplate(
    getPlural(count, [
      TURNS_LEFT_LABELS.leftOne,
      TURNS_LEFT_LABELS.left,
      TURNS_LEFT_LABELS.left,
    ]),
    { count, turns },
  );
}

/**
 * Подпись «через 3 хода»: сколько ходов осталось, без глагола.
 *
 * @param readyOnTurn Ход события.
 * @param currentTurn Текущий ход бастиона.
 * @returns «3 хода».
 */
export function getTurnsSpanText(
  readyOnTurn: number,
  currentTurn: number,
): string {
  const count = getTurnsLeft(readyOnTurn, currentTurn);

  return fillTemplate(TURNS_LEFT_LABELS.span, {
    count,
    turns: getPlural(count, TURN_FORMS),
  });
}

/**
 * Цена варианта приказа подписью: фиксированная, по правилу или бесплатно.
 *
 * @param option Вариант приказа.
 * @returns Подпись цены.
 */
function getOptionCostText(option: FacilityOrderOptionDetail): string {
  if (option.cost) {
    return `${option.cost} ${ACTIVITY_LABELS.gold}`;
  }

  return option.costNote
    ? fillTemplate(ACTIVITY_LABELS.costNote, { note: option.costNote })
    : ACTIVITY_LABELS.free;
}

/**
 * Срок и цена варианта приказа: «7 дн. · 10 зм».
 *
 * @param option Вариант приказа.
 * @returns Подпись условий.
 */
export function getOptionTermsText(option: FacilityOrderOptionDetail): string {
  return fillTemplate(ACTIVITY_LABELS.optionTerms, {
    days: option.days ?? DAYS_PER_TURN,
    cost: getOptionCostText(option),
  });
}

/**
 * Цена и срок постройки базового сооружения: «500 зм · 20 дн. (ходов: 3)».
 *
 * @param space Пространство.
 * @returns Подпись условий.
 */
export function getBuildTermsText(space: FacilitySpaceCode): string {
  const terms = BASIC_BUILD_TERMS[space];

  return fillTemplate(ACTIVITY_LABELS.buildTerms, {
    cost: terms.cost,
    days: terms.days,
    turns: getTurnsFor(terms.days),
  });
}

/**
 * Цена и срок постройки блоков защитной стены: блоки строятся друг за другом.
 *
 * @param squares Сколько блоков.
 * @returns «750 зм · 30 дн. (ходов: 5)».
 */
export function getDefenseWallTermsText(squares: number): string {
  const days = squares * DEFENSE_WALL_DAYS_PER_SQUARE;

  return fillTemplate(DEFENSE_WALL_LABELS.terms, {
    cost: squares * DEFENSE_WALL_COST_PER_SQUARE,
    days,
    turns: getTurnsFor(days),
  });
}

/**
 * Что именно выполняется по приказу: вариант и изготавливаемый предмет.
 *
 * @param order Приказ из журнала.
 * @returns «снаряжение, Кинжал»; пусто, если ни того ни другого нет.
 */
export function getOrderSubject(order: BastionActivityOrder): string {
  return [order.optionName, order.item?.name ?? order.item?.url]
    .filter(Boolean)
    .join(', ');
}

/**
 * Заголовок приказа: приказ, сооружение, вариант и предмет.
 *
 * @param order Приказ из журнала.
 * @returns «Изучать — Библиотека: тему».
 */
export function getOrderTitle(order: BastionActivityOrder): string {
  const target = order.facilityName ?? ACTIVITY_LABELS.maintain;
  const subject = getOrderSubject(order);
  const option = subject ? `: ${subject}` : '';

  return `${order.order.name} — ${target}${option}`;
}

/**
 * Сумма движения казны со знаком.
 *
 * @param amount Сумма, зм.
 * @returns «+500 зм» или «−10 зм».
 */
export function formatLedgerAmount(amount: number): string {
  const sign = amount > 0 ? '+' : '−';

  return `${sign}${Math.abs(amount)} ${ACTIVITY_LABELS.gold}`;
}
