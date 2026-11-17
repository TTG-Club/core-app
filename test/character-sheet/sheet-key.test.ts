import { describe, expect, it } from 'vitest';

import {
  createSheetKey,
  getSheetStateKey,
  parseSheetKey,
} from '~character-sheet/model';

describe('ключ открытого листа', () => {
  it('свой лист и чужой по ссылке получают разные ключи', () => {
    const own = createSheetKey({ source: 'own', id: 'abc' });
    const shared = createSheetKey({ source: 'shared', id: 'abc' });

    expect(own).not.toBe(shared);
  });

  it('ключ разбирается обратно в то же самое', () => {
    const own = { source: 'own', id: 'sheet-1' } as const;
    const shared = { source: 'shared', id: 'token:with:colons' } as const;

    expect(parseSheetKey(createSheetKey(own))).toEqual(own);
    expect(parseSheetKey(createSheetKey(shared))).toEqual(shared);
  });

  it('ключ без известного источника считается своим листом', () => {
    expect(parseSheetKey('sheet-1')).toEqual({ source: 'own', id: 'sheet-1' });

    expect(parseSheetKey('other:sheet-1')).toEqual({
      source: 'own',
      id: 'other:sheet-1',
    });
  });

  it('у разных листов разные ячейки состояния', () => {
    const first = createSheetKey({ source: 'own', id: 'a' });
    const second = createSheetKey({ source: 'own', id: 'b' });

    expect(getSheetStateKey('character', first)).not.toBe(
      getSheetStateKey('character', second),
    );

    expect(getSheetStateKey('character', first)).not.toBe(
      getSheetStateKey('locked', first),
    );
  });

  it('пустой ключ — ошибка, а не общая ячейка на все листы', () => {
    expect(() => getSheetStateKey('character', '')).toThrow();
  });
});
