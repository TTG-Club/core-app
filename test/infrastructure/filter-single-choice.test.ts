import type { FilterGroup } from '~infrastructure/filter';

import { describe, expect, it } from 'vitest';

import {
  buildSearchQuery,
  getActiveFilterChips,
  getSingleChoiceExcludeLabel,
  getSingleChoiceState,
  isSingleChoiceGroup,
  setSingleChoiceState,
} from '~infrastructure/filter';

/** Ключ группы-признака в тестах. */
const ATTUNEMENT_KEY = 'attunement';

/** Название единственного значения группы. */
const REQUIRED_LABEL = 'Требуется';

/** Подпись ответа «нет» для этого значения. */
const NOT_REQUIRED_LABEL = 'Не требуется';

/** Значение без своей подписи ответа «нет». */
const SRD_LABEL = 'SRD 5.2';

/**
 * Собирает группу «Настройка» с единственным значением.
 *
 * @param groupFields поля группы поверх заготовки.
 * @returns группа фильтров.
 */
function createAttunementGroup(
  groupFields: Partial<FilterGroup> = {},
): FilterGroup {
  return {
    key: ATTUNEMENT_KEY,
    name: 'Настройка',
    type: 'filter',
    supports: { mode: true, union: false },
    values: [{ id: 1, value: '1', name: REQUIRED_LABEL, selected: null }],
    ...groupFields,
  };
}

describe('isSingleChoiceGroup', () => {
  it('одно значение и поддержка исключения — группа-признак', () => {
    expect(isSingleChoiceGroup(createAttunementGroup())).toBe(true);
  });

  it('группа без исключения остаётся обычной', () => {
    expect(
      isSingleChoiceGroup(
        createAttunementGroup({ supports: { mode: false, union: false } }),
      ),
    ).toBe(false);

    expect(
      isSingleChoiceGroup(createAttunementGroup({ supports: undefined })),
    ).toBe(false);
  });

  it('группа с несколькими значениями остаётся обычной', () => {
    expect(
      isSingleChoiceGroup(
        createAttunementGroup({
          values: [
            { id: 1, value: '1', name: REQUIRED_LABEL, selected: null },
            { id: 2, value: '2', name: 'Особая', selected: null },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('группа без значений остаётся обычной', () => {
    expect(isSingleChoiceGroup(createAttunementGroup({ values: [] }))).toBe(
      false,
    );
  });
});

describe('getSingleChoiceState', () => {
  it('ничего не отмечено — признак не важен', () => {
    expect(getSingleChoiceState(createAttunementGroup())).toBe('any');
  });

  it('исключение без отмеченного значения на выдачу не влияет', () => {
    expect(getSingleChoiceState(createAttunementGroup({ mode: true }))).toBe(
      'any',
    );
  });

  it('читает положение, которое само записало', () => {
    const group = createAttunementGroup();

    expect(getSingleChoiceState(setSingleChoiceState(group, 'include'))).toBe(
      'include',
    );

    expect(getSingleChoiceState(setSingleChoiceState(group, 'exclude'))).toBe(
      'exclude',
    );
  });
});

describe('setSingleChoiceState', () => {
  it('«нет» уходит в запрос значением и режимом исключения', () => {
    const group = setSingleChoiceState(createAttunementGroup(), 'exclude');

    expect(buildSearchQuery({ filters: [group] })).toEqual({
      [ATTUNEMENT_KEY]: '1',
      [`${ATTUNEMENT_KEY}_mode`]: '1',
    });
  });

  it('«да» уходит в запрос одним значением', () => {
    const group = setSingleChoiceState(createAttunementGroup(), 'include');

    expect(buildSearchQuery({ filters: [group] })).toEqual({
      [ATTUNEMENT_KEY]: '1',
    });
  });

  it('«не важно» после «нет» снимает и значение, и исключение', () => {
    const excluded = setSingleChoiceState(createAttunementGroup(), 'exclude');
    const cleared = setSingleChoiceState(excluded, 'any');

    expect(cleared.mode).toBe(false);
    expect(buildSearchQuery({ filters: [cleared] })).toEqual({});
  });

  it('«да» после забытого исключения его снимает', () => {
    const group = setSingleChoiceState(
      createAttunementGroup({ mode: true }),
      'include',
    );

    expect(group.mode).toBe(false);
  });

  it('исходную группу не меняет', () => {
    const group = createAttunementGroup();

    setSingleChoiceState(group, 'exclude');

    expect(group).toEqual(createAttunementGroup());
  });
});

describe('getSingleChoiceExcludeLabel', () => {
  it('берёт готовую подпись ответа «нет»', () => {
    expect(getSingleChoiceExcludeLabel(REQUIRED_LABEL)).toBe(
      NOT_REQUIRED_LABEL,
    );

    expect(getSingleChoiceExcludeLabel('Есть')).toBe('Нет');
    expect(getSingleChoiceExcludeLabel('Да')).toBe('Нет');
  });

  it('значению без своей подписи ставит отрицание', () => {
    expect(getSingleChoiceExcludeLabel(SRD_LABEL)).toBe(`Не ${SRD_LABEL}`);
  });
});

describe('плашка исключённого признака', () => {
  it('называется ответом «нет»', () => {
    const group = setSingleChoiceState(createAttunementGroup(), 'exclude');

    expect(getActiveFilterChips([group])).toEqual([
      {
        groupKey: ATTUNEMENT_KEY,
        itemId: '1',
        label: `Настройка: ${NOT_REQUIRED_LABEL}`,
        isExcluded: true,
      },
    ]);
  });

  it('у отмеченного признака подпись прежняя', () => {
    const group = setSingleChoiceState(createAttunementGroup(), 'include');

    expect(getActiveFilterChips([group])[0]?.label).toBe(
      `Настройка: ${REQUIRED_LABEL}`,
    );
  });
});
