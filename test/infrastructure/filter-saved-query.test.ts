import type { FilterGroup } from '~infrastructure/filter';

import { describe, expect, it } from 'vitest';

import {
  applyQueryToFilters,
  getFilterCookieName,
  parseQueryList,
  parseSavedFilterQuery,
} from '~infrastructure/filter';

describe('parseQueryList', () => {
  it('разбирает акронимы через запятую', () => {
    expect(parseQueryList('PHB,RHW')).toEqual(['PHB', 'RHW']);
  });

  it('пропускает пустые куски', () => {
    expect(parseQueryList('PHB,,')).toEqual(['PHB']);
  });

  it('не считает выбором пустую строку, список и отсутствие значения', () => {
    expect(parseQueryList('')).toBeUndefined();
    expect(parseQueryList(',')).toBeUndefined();
    expect(parseQueryList(['PHB'])).toBeUndefined();
    expect(parseQueryList(null)).toBeUndefined();
    expect(parseQueryList(undefined)).toBeUndefined();
  });
});

describe('parseSavedFilterQuery', () => {
  it('берёт только строки и списки строк', () => {
    expect(
      parseSavedFilterQuery({
        source: 'PHB',
        level: ['1', '2'],
        broken: 5,
        mixed: ['1', 2],
      }),
    ).toEqual({ source: 'PHB', level: ['1', '2'] });
  });

  it('не принимает не-объект', () => {
    expect(parseSavedFilterQuery('PHB')).toEqual({});
    expect(parseSavedFilterQuery(undefined)).toEqual({});
    expect(parseSavedFilterQuery(['PHB'])).toEqual({});
  });
});

describe('getFilterCookieName', () => {
  it('добавляет к ключу фильтра общий префикс', () => {
    expect(getFilterCookieName('filter-classes')).toBe(
      'ttg-section-filter-classes',
    );
  });

  it('добавляет префикс `filter-` к ключу раздела', () => {
    expect(getFilterCookieName('classes')).toBe('ttg-section-filter-classes');
  });
});

describe('applyQueryToFilters', () => {
  const SOURCE_GROUP: FilterGroup = {
    key: 'OFFICIAL',
    name: 'Официальные',
    type: 'filter',
    values: [
      { id: 'PHB', value: 'PHB', name: 'PHB', selected: true },
      { id: 'XGE', value: 'XGE', name: 'XGE', selected: true },
    ],
  };

  it('отмечает источники из параметра адреса', () => {
    const result = applyQueryToFilters(
      { filters: [], sources: [SOURCE_GROUP] },
      { source: 'XGE,' },
    );

    expect(
      result.sources?.[0]?.values?.map((sourceItem) => sourceItem.selected),
    ).toEqual([null, true]);
  });

  it('без выбора в адресе оставляет источники по умолчанию', () => {
    const result = applyQueryToFilters(
      { filters: [], sources: [SOURCE_GROUP] },
      { source: ',' },
    );

    expect(result.sources?.[0]).toBe(SOURCE_GROUP);
  });
});
