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
 * Заголовок приказа: приказ, сооружение и вариант.
 *
 * @param order Приказ из журнала.
 * @returns «Изучать — Библиотека: тему».
 */
export function getOrderTitle(order: BastionActivityOrder): string {
  const target = order.facilityName ?? ACTIVITY_LABELS.maintain;
  const option = order.optionName ? `: ${order.optionName}` : '';

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
