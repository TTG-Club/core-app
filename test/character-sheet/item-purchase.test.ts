import type {
  CharacterCurrency,
  CharacterInventoryItem,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  addCopperToCurrency,
  buildInventoryItem,
  getCopperAmountLabel,
  getInventoryItemMenuItems,
  getInventoryItemSalePriceInCopper,
  getPurchaseCostInCopper,
  spendCurrency,
} from '~character-sheet/model';

const EMPTY_WALLET: CharacterCurrency = {
  copper: 0,
  silver: 0,
  electrum: 0,
  gold: 0,
  platinum: 0,
};

describe('стоимость покупки', () => {
  it('складывает цены в разных монетах, нераспознанные — бесплатны', () => {
    expect(
      getPurchaseCostInCopper(['10 зм', '5 см', '2 мм', 'варьируется', '']),
    ).toBe(1052);
  });

  it('читает разряды, разделённые пробелом', () => {
    expect(getPurchaseCostInCopper(['1 500 зм'])).toBe(150000);
  });

  it('подписывает сумму золотом, серебром и медью', () => {
    expect(getCopperAmountLabel(1052)).toBe('10 зм 5 см 2 мм');
    expect(getCopperAmountLabel(0)).toBe('0 зм');
  });
});

describe('списание денег за покупку', () => {
  it('платит монетами нужного номинала без размена', () => {
    expect(spendCurrency({ ...EMPTY_WALLET, gold: 15 }, 1000)).toEqual({
      ...EMPTY_WALLET,
      gold: 5,
    });
  });

  it('разменивает золотой, когда серебра нет', () => {
    expect(spendCurrency({ ...EMPTY_WALLET, gold: 1 }, 50)).toEqual({
      ...EMPTY_WALLET,
      silver: 5,
    });
  });

  it('разменивает платину со сдачей золотом, серебром и медью', () => {
    expect(
      spendCurrency({ ...EMPTY_WALLET, copper: 3, platinum: 1 }, 258),
    ).toEqual({ ...EMPTY_WALLET, gold: 7, silver: 4, copper: 5 });
  });

  it('при нехватке денег ничего не списывает', () => {
    expect(spendCurrency({ ...EMPTY_WALLET, gold: 1, silver: 9 }, 200)).toBe(
      null,
    );
  });

  it('бесплатная покупка оставляет кошелёк как был', () => {
    const wallet = { ...EMPTY_WALLET, silver: 3 };

    expect(spendCurrency(wallet, 0)).toEqual(wallet);
  });
});

const ROPE: CharacterInventoryItem = {
  ...buildInventoryItem({
    url: 'rope',
    name: 'Верёвка',
    category: 'ITEM',
    typesLabel: '',
    cost: '1 зм',
    weight: 5,
    armor: null,
    weapon: null,
    activeEffects: [],
  }),
  quantity: 3,
};

const MENU_OPTIONS = {
  onRemove: () => undefined,
  twoHanded: false,
  attackAbility: null,
  rulesAttackAbility: null,
  attuned: false,
  active: false,
};

describe('продажа предмета', () => {
  it('выручка — цена за каждую штуку в наличии', () => {
    expect(getInventoryItemSalePriceInCopper(ROPE)).toBe(300);
  });

  it('предмет без цены или без наличия не продаётся', () => {
    expect(
      getInventoryItemSalePriceInCopper({ ...ROPE, cost: 'варьируется' }),
    ).toBe(null);

    expect(getInventoryItemSalePriceInCopper({ ...ROPE, quantity: 0 })).toBe(
      null,
    );
  });

  it('выручка приходит золотом, серебром и медью', () => {
    expect(
      addCopperToCurrency({ ...EMPTY_WALLET, gold: 2, platinum: 1 }, 1052),
    ).toEqual({ ...EMPTY_WALLET, gold: 12, silver: 5, copper: 2, platinum: 1 });
  });

  it('пункт «Продать» стоит прямо перед удалением', () => {
    const labels = getInventoryItemMenuItems({
      ...MENU_OPTIONS,
      onSell: () => undefined,
    }).map((menuItem) => menuItem.label);

    expect(labels.slice(-2)).toEqual(['Продать', 'Убрать из снаряжения']);
  });

  it('без продажи пункта нет', () => {
    const labels = getInventoryItemMenuItems(MENU_OPTIONS).map(
      (menuItem) => menuItem.label,
    );

    expect(labels).not.toContain('Продать');
  });
});
