import type { ClassLinkResponse } from '~classes/model';

import { describe, expect, it } from 'vitest';

import {
  filterSubclassesBySources,
  getSubclassesHiddenLabel,
  SUBCLASSES_HIDDEN_BY_SOURCES_LABEL_PREFIX,
} from '~classes/model';

/**
 * Собирает подкласс из указанного источника.
 *
 * @param url Адрес подкласса.
 * @param sourceAcronym Акроним источника.
 * @returns Ссылка на подкласс.
 */
function createSubclass(url: string, sourceAcronym: string): ClassLinkResponse {
  return {
    url,
    name: { rus: url, eng: url },
    source: {
      name: { label: sourceAcronym, rus: sourceAcronym, eng: sourceAcronym },
      group: { label: 'basic', rus: 'Основные' },
      page: 0,
    },
    image: '',
    updatedAt: '',
  };
}

const SUBCLASSES = [
  createSubclass('bard-lore', 'PHB'),
  createSubclass('bard-spirits', 'RHW'),
  createSubclass('bard-homebrew', 'HB'),
];

describe('filterSubclassesBySources', () => {
  it('без выбранных источников оставляет все подклассы', () => {
    const result = filterSubclassesBySources(SUBCLASSES, undefined);

    expect(result.subclasses).toEqual(SUBCLASSES);
    expect(result.hiddenCount).toBe(0);
  });

  it('оставляет подклассы только из выбранных источников', () => {
    const result = filterSubclassesBySources(SUBCLASSES, ['PHB', 'RHW']);

    expect(result.subclasses.map((subclass) => subclass.url)).toEqual([
      'bard-lore',
      'bard-spirits',
    ]);

    expect(result.hiddenCount).toBe(1);
  });

  it('скрывает все подклассы, если их источники не выбраны', () => {
    const result = filterSubclassesBySources(SUBCLASSES, ['XGE']);

    expect(result.subclasses).toEqual([]);
    expect(result.hiddenCount).toBe(3);
  });
});

describe('getSubclassesHiddenLabel', () => {
  it('ничего не пишет, если скрытых нет', () => {
    expect(getSubclassesHiddenLabel(0)).toBeUndefined();
  });

  it('пишет число скрытых подклассов', () => {
    expect(getSubclassesHiddenLabel(2)).toBe(
      `${SUBCLASSES_HIDDEN_BY_SOURCES_LABEL_PREFIX}2`,
    );
  });
});
