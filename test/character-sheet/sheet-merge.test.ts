import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  mergeCharacterSheets,
  mergeSheetValues,
} from '~character-sheet/model';

describe('слияние одновременных правок листа', () => {
  it('правки разных полей складываются', () => {
    const base = { name: 'Гимли', hp: 10, notes: { text: '' } };
    const mine = { name: 'Гимли', hp: 7, notes: { text: '' } };
    const theirs = { name: 'Гимли', hp: 10, notes: { text: 'Топор' } };

    expect(mergeSheetValues(base, mine, theirs)).toEqual({
      name: 'Гимли',
      hp: 7,
      notes: { text: 'Топор' },
    });
  });

  it('одно и то же поле поменяли оба — побеждает своя правка', () => {
    expect(mergeSheetValues({ hp: 10 }, { hp: 7 }, { hp: 5 })).toEqual({
      hp: 7,
    });
  });

  it('списки с id сливаются поэлементно', () => {
    const base = [
      { id: 'a', count: 1 },
      { id: 'b', count: 1 },
    ];

    const mine = [
      { id: 'a', count: 2 },
      { id: 'b', count: 1 },
      { id: 'c', count: 1 },
    ];

    const theirs = [
      { id: 'a', count: 1 },
      { id: 'b', count: 3 },
      { id: 'd', count: 1 },
    ];

    expect(mergeSheetValues(base, mine, theirs)).toEqual([
      { id: 'a', count: 2 },
      { id: 'b', count: 3 },
      { id: 'd', count: 1 },
      { id: 'c', count: 1 },
    ]);
  });

  it('удаление побеждает только нетронутый элемент', () => {
    const base = [
      { id: 'a', count: 1 },
      { id: 'b', count: 1 },
    ];

    // Сам удалил «a», а на сервере «a» не трогали, зато удалили «b», который я
    // успел поправить.
    const mine = [{ id: 'b', count: 2 }];
    const theirs = [{ id: 'a', count: 1 }];

    expect(mergeSheetValues(base, mine, theirs)).toEqual([
      { id: 'b', count: 2 },
    ]);
  });

  it('лист после слияния проходит схему', () => {
    const base = structuredClone({ ...DEFAULT_CHARACTER, id: 'sheet' });
    const mine = { ...structuredClone(base), name: 'Гимли' };
    const theirs = { ...structuredClone(base), inspiration: true };

    const merged = mergeCharacterSheets(base, mine, theirs);

    expect(merged.name).toBe('Гимли');
    expect(merged.inspiration).toBe(true);
  });
});
