import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import {
  countActiveGameFilters,
  createEmptyGameFilter,
  isEmptyGameFilter,
  parseCatalogPageFromQuery,
  parseGameFilterFromQuery,
  serializeGameFilterToQuery,
  toGameSearchQuery,
} from '~find-game/model';

/**
 * Приводит собранные параметры к тому виду, в каком их отдаёт маршрут: в
 * адресе всё становится строкой, и обратный разбор работает именно с этим.
 *
 * @param query Параметры, собранные из фильтра.
 */
function toRouteQuery(query: LocationQueryRaw): LocationQuery {
  const entries = Object.entries(query).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.map((item) => (item == null ? null : String(item)))];
    }

    return [key, value == null ? null : String(value)];
  });

  return Object.fromEntries(entries);
}

describe('чтение фильтра из адреса', () => {
  it('пустой адрес даёт пустой фильтр', () => {
    const filter = parseGameFilterFromQuery({});

    expect(isEmptyGameFilter(filter)).toBe(true);
    expect(filter).toEqual(createEmptyGameFilter());
  });

  it('читает перечисление через запятую', () => {
    const filter = parseGameFilterFromQuery({ type: 'ONLINE,OFFLINE' });

    expect(filter.type).toEqual(['ONLINE', 'OFFLINE']);
  });

  it('читает повтор параметра — сервис принимает и такую запись', () => {
    const filter = parseGameFilterFromQuery({ type: ['ONLINE', 'OFFLINE'] });

    expect(filter.type).toEqual(['ONLINE', 'OFFLINE']);
  });

  it('читает исключающие фильтры отдельно от включающих', () => {
    const filter = parseGameFilterFromQuery({
      system: 'DND_2024',
      excludeType: 'TEXT',
      excludeCity: 'Москва',
    });

    expect(filter.system).toEqual(['DND_2024']);
    expect(filter.excludeType).toEqual(['TEXT']);
    expect(filter.excludeCity).toEqual(['Москва']);
    expect(filter.type).toEqual([]);
  });

  it('выбрасывает незнакомое значение перечисления', () => {
    // Отправлять его в сервис нельзя: он ответит 400 на весь запрос, и
    // каталог покажет ошибку вместо выдачи.
    const filter = parseGameFilterFromQuery({ type: 'ONLINE,TELEPATHY' });

    expect(filter.type).toEqual(['ONLINE']);
  });

  it('не считает пустую строку заданным условием', () => {
    const filter = parseGameFilterFromQuery({ city: '', type: '' });

    expect(filter.city).toEqual([]);
    expect(filter.type).toEqual([]);
    expect(isEmptyGameFilter(filter)).toBe(true);
  });

  it('переживает null в значении параметра', () => {
    const query: LocationQuery = { city: null, type: [null, 'ONLINE'] };
    const filter = parseGameFilterFromQuery(query);

    expect(filter.city).toEqual([]);
    expect(filter.type).toEqual(['ONLINE']);
  });

  it('схлопывает повторы значений', () => {
    const filter = parseGameFilterFromQuery({ type: 'ONLINE,ONLINE,OFFLINE' });

    expect(filter.type).toEqual(['ONLINE', 'OFFLINE']);
  });

  it('читает трёхзначный кроссплей', () => {
    expect(
      parseGameFilterFromQuery({ crossplayAllowed: 'true' }).crossplayAllowed,
    ).toBe(true);

    expect(
      parseGameFilterFromQuery({ crossplayAllowed: 'false' }).crossplayAllowed,
    ).toBe(false);

    expect(
      parseGameFilterFromQuery({ crossplayAllowed: 'да' }).crossplayAllowed,
    ).toBeNull();

    expect(parseGameFilterFromQuery({}).crossplayAllowed).toBeNull();
  });

  it('читает возрастные границы и отбрасывает выходящие за пределы', () => {
    expect(parseGameFilterFromQuery({ minAge: '18' }).minAge).toBe(18);
    expect(parseGameFilterFromQuery({ minAge: '999' }).minAge).toBeNull();

    expect(
      parseGameFilterFromQuery({ minAge: 'восемнадцать' }).minAge,
    ).toBeNull();
  });

  it('снимает перевёрнутый возрастной диапазон', () => {
    // Сервис отвечает 400 на весь запрос, поэтому из такого адреса остаётся
    // только нижняя граница.
    const filter = parseGameFilterFromQuery({ minAge: '30', maxAge: '18' });

    expect(filter.minAge).toBe(30);
    expect(filter.maxAge).toBeNull();
  });
});

describe('чтение страницы из адреса', () => {
  it('без параметра открывается первая страница', () => {
    expect(parseCatalogPageFromQuery({})).toBe(0);
  });

  it('в адресе страница человеческая, внутри — с нуля', () => {
    expect(parseCatalogPageFromQuery({ page: '3' })).toBe(2);
  });

  it('нулевая и отрицательная страница считаются первой', () => {
    expect(parseCatalogPageFromQuery({ page: '0' })).toBe(0);
    expect(parseCatalogPageFromQuery({ page: '-5' })).toBe(0);
  });
});

describe('запись фильтра в адрес', () => {
  it('пустой фильтр даёт чистый адрес', () => {
    expect(serializeGameFilterToQuery(createEmptyGameFilter(), 0)).toEqual({});
  });

  it('склеивает множественные значения запятой', () => {
    const filter = createEmptyGameFilter();

    filter.type = ['ONLINE', 'OFFLINE'];
    filter.excludeSystem = ['DND_2014'];

    expect(serializeGameFilterToQuery(filter, 0)).toEqual({
      type: 'ONLINE,OFFLINE',
      excludeSystem: 'DND_2014',
    });
  });

  it('первая страница в адрес не попадает', () => {
    const filter = createEmptyGameFilter();

    expect(serializeGameFilterToQuery(filter, 0).page).toBeUndefined();
    expect(serializeGameFilterToQuery(filter, 2).page).toBe('3');
  });

  it('пишет кроссплей и возраст, когда они заданы', () => {
    const filter = createEmptyGameFilter();

    filter.crossplayAllowed = false;
    filter.minAge = 18;

    expect(serializeGameFilterToQuery(filter, 0)).toEqual({
      crossplayAllowed: 'false',
      minAge: '18',
    });
  });

  it('адрес и разбор адреса обратимы', () => {
    const filter = createEmptyGameFilter();

    filter.system = ['DND_2024'];
    filter.excludeType = ['TEXT'];
    filter.city = ['Кишинёв'];
    filter.crossplayAllowed = true;
    filter.minAge = 18;
    filter.maxAge = 40;

    const query = toRouteQuery(serializeGameFilterToQuery(filter, 4));
    const restored = parseGameFilterFromQuery(query);

    expect(restored).toEqual(filter);
    expect(parseCatalogPageFromQuery(query)).toBe(4);
  });
});

describe('запрос к сервису', () => {
  it('передаёт условия вместе с серверной пагинацией', () => {
    const filter = createEmptyGameFilter();

    filter.costType = ['FREE'];
    filter.excludeType = ['TEXT'];

    expect(toGameSearchQuery(filter, 2, 12)).toEqual({
      costType: 'FREE',
      excludeType: 'TEXT',
      page: 2,
      size: 12,
    });
  });

  it('пустой фильтр отправляет только пагинацию', () => {
    expect(toGameSearchQuery(createEmptyGameFilter(), 0, 12)).toEqual({
      page: 0,
      size: 12,
    });
  });
});

describe('счётчик условий', () => {
  it('считает каждое заданное поле один раз', () => {
    const filter = createEmptyGameFilter();

    expect(countActiveGameFilters(filter)).toBe(0);

    filter.type = ['ONLINE', 'OFFLINE'];
    expect(countActiveGameFilters(filter)).toBe(1);

    filter.excludeType = ['TEXT'];
    expect(countActiveGameFilters(filter)).toBe(2);

    filter.minAge = 18;
    expect(countActiveGameFilters(filter)).toBe(3);
  });
});
