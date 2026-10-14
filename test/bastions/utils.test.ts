import type { BastionFacilityCreate } from '~bastions/model';

import { describe, expect, it } from 'vitest';

import {
  compareBastionGroups,
  getBastionGroupLabel,
  getFacilitySubtitle,
  getOrderOptionTerms,
  normalizeLoadedBastion,
  transformBastionBeforeSubmit,
} from '~bastions/model';

/**
 * Собирает форму сооружения; нужные тесту поля подменяются.
 *
 * @param overrides поля, которые отличаются от пустой формы.
 * @returns состояние формы.
 */
function createState(
  overrides: Partial<BastionFacilityCreate> = {},
): BastionFacilityCreate {
  return {
    url: 'library',
    name: { rus: 'Библиотека', eng: 'Library', alt: [] },
    source: { url: 'DMG24', page: 293 },
    srdVersion: undefined,
    tags: [],
    description: 'Описание',
    category: 'SPECIAL',
    level: 5,
    prerequisite: undefined,
    space: 'ROOMY',
    hirelings: 1,
    repeatable: false,
    orders: ['RESEARCH'],
    orderOptions: [],
    enlargement: null,
    features: [],
    choices: [],
    ...overrides,
  };
}

describe('группы списка бастионов', () => {
  it('базовые сооружения идут первыми, уровни — по возрастанию как числа', () => {
    const keys = ['13', '', '5', '17', '9'];

    expect([...keys].sort(compareBastionGroups)).toEqual([
      '',
      '5',
      '9',
      '13',
      '17',
    ]);
  });

  it('пустой уровень подписан как базовые сооружения', () => {
    expect(getBastionGroupLabel('')).toBe('Базовые сооружения');
    expect(getBastionGroupLabel('9')).toBe('9 уровень');
  });
});

describe('подзаголовок сооружения', () => {
  it('как в книге: уровень и «сооружение бастиона»', () => {
    expect(getFacilitySubtitle({ level: 5 })).toBe(
      'Уровень 5, сооружение бастиона',
    );
  });

  it('у базового сооружения уровня нет', () => {
    expect(
      getFacilitySubtitle({
        category: { value: 'BASIC', name: 'базовое сооружение' },
      }),
    ).toBe('Базовое сооружение бастиона');
  });
});

describe('условия варианта приказа', () => {
  it('ноль зм — бесплатно, уровень — «с N уровня»', () => {
    expect(
      getOrderOptionTerms({
        order: 'CRAFT',
        name: 'книгу',
        description: null,
        days: 7,
        cost: 0,
        costNote: null,
        minLevel: 9,
      }),
    ).toBe('7 дн. · бесплатно · с 9 уровня');
  });
});

describe('подготовка формы к отправке', () => {
  it('у базового сооружения снимаются уровень, требование и приказы', () => {
    const body = transformBastionBeforeSubmit(
      createState({
        category: 'BASIC',
        level: 5,
        prerequisite: 'EXPERTISE',
        orders: ['CRAFT'],
        orderOptions: [
          {
            order: 'CRAFT',
            days: 7,
            cost: null,
            minLevel: null,
          },
        ],
      }),
    );

    expect(body.level).toBeUndefined();
    expect(body.prerequisite).toBeUndefined();
    expect(body.orders).toEqual([]);
    expect(body.orderOptions).toEqual([]);
  });

  it('выбрасывает варианты без приказа и чужих приказов', () => {
    const body = transformBastionBeforeSubmit(
      createState({
        orders: ['RESEARCH'],
        orderOptions: [
          { order: 'RESEARCH', days: 7, cost: 0, minLevel: null },
          { order: 'CRAFT', days: 7, cost: 0, minLevel: null },
          { days: null, cost: null, minLevel: null },
        ],
      }),
    );

    expect(body.orderOptions.map((option) => option.order)).toEqual([
      'RESEARCH',
    ]);
  });

  it('расширение без пространства не отправляется', () => {
    const body = transformBastionBeforeSubmit(
      createState({
        enlargement: {
          cost: 2000,
          days: null,
          additionalHirelings: null,
        },
      }),
    );

    expect(body.enlargement).toBeNull();
  });
});

describe('загрузка формы', () => {
  it('снимает null и даёт спискам массивы', () => {
    const loaded = normalizeLoadedBastion({
      url: 'garden',
      prerequisite: null,
      orders: null,
      orderOptions: [{ order: 'HARVEST', name: null, days: 7 }],
      choices: [{ name: 'Тип сада', options: null }],
    });

    expect(loaded).not.toHaveProperty('prerequisite');
    expect(loaded.orders).toEqual([]);
    expect(loaded.orderOptions).toEqual([{ order: 'HARVEST', days: 7 }]);
    expect(loaded.choices).toEqual([{ name: 'Тип сада', options: [] }]);
    expect(loaded.features).toEqual([]);
  });
});
