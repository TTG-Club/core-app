import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  parseCharacterSheetDetail,
  parseCharacterSheetVersion,
} from '~character-sheet/model';

const SHEET_ID = '7d1f3c2a-0000-4000-8000-000000000001';

describe('версия листа персонажа', () => {
  it('приходит в полном листе', () => {
    const detail = parseCharacterSheetDetail({
      id: SHEET_ID,
      name: 'Гимли',
      data: DEFAULT_CHARACTER,
      shareToken: null,
      version: 7,
    });

    expect(detail.version).toBe(7);
  });

  it('отсутствует у бэка без версий — лист открывается, сохранение без проверки', () => {
    const detail = parseCharacterSheetDetail({
      id: SHEET_ID,
      name: 'Гимли',
      data: DEFAULT_CHARACTER,
    });

    expect(detail.version).toBeNull();
  });

  it('читается из ответа сохранения', () => {
    expect(parseCharacterSheetVersion({ id: SHEET_ID, version: 8 })).toBe(8);
  });

  it('пустой ответ сохранения не роняет автосохранение', () => {
    expect(parseCharacterSheetVersion('')).toBeNull();
    expect(parseCharacterSheetVersion({ id: SHEET_ID })).toBeNull();
  });
});
