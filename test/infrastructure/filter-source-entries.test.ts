import type { FilterGroup } from '~infrastructure/filter';

import { describe, expect, it } from 'vitest';

import {
  applySourcePreset,
  buildSourceCatalog,
  countSources,
  getSourceEntries,
  isSourcePresetActive,
  isSourcePresetAvailable,
  searchSourceEntries,
  setSourcesSelected,
} from '~infrastructure/filter';

/** Акроним «Книги игрока». */
const HANDBOOK_ACRONYM = 'PHB';

/** Русское название «Книги игрока». */
const HANDBOOK_NAME = 'Книга игрока';

/** Английское название «Книги игрока». */
const HANDBOOK_ENGLISH = "Player's Handbook";

/** Акроним источника, которого нет в справочнике. */
const UNKNOWN_ACRONYM = 'XX';

const catalog = buildSourceCatalog([
  {
    acronym: HANDBOOK_ACRONYM,
    name: HANDBOOK_NAME,
    english: HANDBOOK_ENGLISH,
  },
  { acronym: 'AU', name: 'Неудержимая магия', english: 'Arcana Unleashed' },
]);

/**
 * Собирает группу источников, как её отдают фильтры раздела: идентификатор
 * значения — акроним.
 *
 * @returns группа «Базовые» с тремя источниками.
 */
function createGroup(): FilterGroup {
  return {
    key: 'OFFICIAL',
    name: 'Базовые',
    type: 'filter',
    values: [
      {
        id: HANDBOOK_ACRONYM,
        value: HANDBOOK_ACRONYM,
        name: HANDBOOK_NAME,
        selected: true,
      },
      { id: 'AU', value: 'AU', name: 'Неудержимая магия', selected: null },
      {
        id: UNKNOWN_ACRONYM,
        value: UNKNOWN_ACRONYM,
        name: 'Вбросы',
        selected: null,
      },
    ],
  };
}

describe('getSourceEntries', () => {
  it('добавляет английское название и акроним из справочника', () => {
    const [handbook] = getSourceEntries(createGroup(), catalog);

    expect(handbook?.english).toBe(HANDBOOK_ENGLISH);
    expect(handbook?.acronym).toBe(HANDBOOK_ACRONYM);
  });

  it('без справочника берёт акроним из идентификатора', () => {
    const entries = getSourceEntries(createGroup(), buildSourceCatalog([]));

    expect(entries.at(2)?.acronym).toBe(UNKNOWN_ACRONYM);
    expect(entries.at(2)?.english).toBeUndefined();
  });

  it('находит источник по названию, когда идентификатор — само название', () => {
    const group: FilterGroup = {
      key: 'Basic',
      name: 'Базовые',
      type: 'filter',
      values: [
        {
          id: HANDBOOK_NAME,
          value: HANDBOOK_NAME,
          name: HANDBOOK_NAME,
          selected: null,
        },
        { id: 'Вбросы', value: 'Вбросы', name: 'Вбросы', selected: null },
      ],
    };

    const [handbook, unknown] = getSourceEntries(group, catalog);

    expect(handbook?.acronym).toBe(HANDBOOK_ACRONYM);
    expect(handbook?.english).toBe(HANDBOOK_ENGLISH);
    expect(unknown?.acronym).toBeUndefined();
  });
});

describe('searchSourceEntries', () => {
  const group = createGroup();
  const entries = getSourceEntries(group, catalog);

  /**
   * Названия источников, оставшихся под запросом.
   *
   * @param search строка поиска.
   */
  function searchNames(search: string): Array<string> {
    return searchSourceEntries(group, entries, search).map(
      (entry) => entry.item.name,
    );
  }

  it('ищет по английскому названию и по акрониму', () => {
    expect(searchNames('handbook')).toEqual([HANDBOOK_NAME]);
    expect(searchNames('au')).toEqual(['Неудержимая магия']);
  });

  it('не удерживает отмеченные источники, не подошедшие под запрос', () => {
    expect(searchNames('вбросы')).toEqual(['Вбросы']);
  });

  it('по названию группы показывает её целиком', () => {
    expect(searchNames('базовые')).toHaveLength(3);
  });

  it('подхватывает запрос в неверной раскладке', () => {
    expect(searchNames('фксфтф')).toEqual(['Неудержимая магия']);
  });
});

describe('setSourcesSelected', () => {
  it('меняет только перечисленные источники и не мутирует группу', () => {
    const group = createGroup();

    const updated = setSourcesSelected(
      group,
      new Set(['AU', UNKNOWN_ACRONYM]),
      true,
    );

    expect(countSources([updated])).toEqual({ selected: 3, total: 3 });
    expect(countSources([group])).toEqual({ selected: 1, total: 3 });
  });

  it('снятая отметка — это `null`, а не `false`', () => {
    const updated = setSourcesSelected(
      createGroup(),
      new Set([HANDBOOK_ACRONYM]),
      false,
    );

    expect(updated.values?.at(0)?.selected).toBeNull();
  });
});

describe('быстрые наборы', () => {
  /** Группа сеттингов с одной отмеченной книгой. */
  const settings: FilterGroup = {
    key: 'SETTING',
    name: 'Сеттинги',
    type: 'filter',
    values: [{ id: 'EFA', value: 'EFA', name: 'Эберрон', selected: true }],
  };

  it('отмечает группы набора целиком и снимает остальные', () => {
    const updated = applySourcePreset([createGroup(), settings], ['OFFICIAL']);

    expect(countSources(updated)).toEqual({ selected: 3, total: 4 });
    expect(updated.at(1)?.values?.at(0)?.selected).toBeNull();
    expect(isSourcePresetActive(updated, ['OFFICIAL'])).toBe(true);
    expect(isSourcePresetActive(updated, ['OFFICIAL', 'SETTING'])).toBe(false);
  });

  it('набор недоступен, когда в панели нет его группы', () => {
    expect(isSourcePresetAvailable([createGroup()], ['OFFICIAL'])).toBe(true);

    expect(
      isSourcePresetAvailable([createGroup()], ['OFFICIAL', 'SETTING']),
    ).toBe(false);
  });
});
