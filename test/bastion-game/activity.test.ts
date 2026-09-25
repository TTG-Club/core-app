import type { BastionActivityOrder } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  formatLedgerAmount,
  getBuildTermsText,
  getOptionTermsText,
  getOrderTitle,
  getTurnsFor,
  isBastionOrderCode,
} from '~bastion-game/model';

/**
 * Приказ из журнала; поля, не влияющие на заголовок, заполнены как попало.
 *
 * @param overrides Поля, которые важны для проверки.
 * @returns приказ.
 */
function createOrder(
  overrides: Partial<BastionActivityOrder> = {},
): BastionActivityOrder {
  return {
    id: 'order',
    facilityId: 'facility',
    facilityName: 'Библиотека',
    order: { value: 'RESEARCH', name: 'Изучать' },
    optionName: 'Тема',
    costGp: 0,
    givenOnTurn: 1,
    completesOnTurn: 2,
    status: 'ACTIVE',
    givenBy: 'user',
    note: null,
    result: null,
    canCancel: true,
    ...overrides,
  };
}

describe('getTurnsFor', () => {
  it('округляет дни вверх до ходов по 7 дней', () => {
    expect(getTurnsFor(7)).toBe(1);
    expect(getTurnsFor(8)).toBe(2);
    expect(getTurnsFor(20)).toBe(3);
  });

  it('без срока — один ход', () => {
    expect(getTurnsFor(null)).toBe(1);
    expect(getTurnsFor(0)).toBe(1);
  });
});

describe('isBastionOrderCode', () => {
  it('узнаёт приказы бастиона', () => {
    expect(isBastionOrderCode('MAINTAIN')).toBe(true);
    expect(isBastionOrderCode('DANCE')).toBe(false);
  });
});

describe('getOptionTermsText', () => {
  it('показывает цену и срок, без срока — неделя', () => {
    expect(getOptionTermsText({ cost: 10, days: 14 })).toBe('14 дн. · 10 зм');
    expect(getOptionTermsText({})).toBe('7 дн. · бесплатно');
  });

  it('цена по правилу — пояснением', () => {
    expect(getOptionTermsText({ costNote: 'по таблице' })).toBe(
      '7 дн. · цена по правилу: по таблице',
    );
  });
});

describe('getBuildTermsText', () => {
  it('тесное строится 3 хода', () => {
    expect(getBuildTermsText('CRAMPED')).toBe('500 зм · 20 дн. (ходов: 3)');
  });
});

describe('getOrderTitle', () => {
  it('собирает приказ, сооружение и вариант', () => {
    expect(getOrderTitle(createOrder())).toBe('Изучать — Библиотека: Тема');
  });

  it('«Обслуживать» без сооружения — всему бастиону', () => {
    expect(
      getOrderTitle(
        createOrder({
          facilityName: null,
          optionName: null,
          order: { value: 'MAINTAIN', name: 'Обслуживать' },
        }),
      ),
    ).toBe('Обслуживать — Обслуживание');
  });
});

describe('formatLedgerAmount', () => {
  it('ставит знак', () => {
    expect(formatLedgerAmount(500)).toBe('+500 зм');
    expect(formatLedgerAmount(-10)).toBe('−10 зм');
  });
});
