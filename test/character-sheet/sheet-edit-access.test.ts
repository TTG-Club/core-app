import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  getSavedSheetActionMenuItems,
  parseCharacterSheetDetail,
  parseCharacterSheetListPage,
  parseSavedCharacterSheet,
  parseSheetEditorList,
  parseSheetEditRequestCount,
  parseSheetPresence,
  SHEET_EDIT_ACCESS_LABELS,
} from '~character-sheet/model';

const SHEET_ID = '7d1f3c2a-0000-4000-8000-000000000001';
const SAVED_ID = '7d1f3c2a-0000-4000-8000-000000000002';
const SHARE_TOKEN = '7d1f3c2a-0000-4000-8000-000000000003';

/** Пустой обработчик пунктов меню. */
function noop(): void {}

/**
 * Подписи пунктов меню сохранённого листа при заданном праве на правки.
 *
 * @param editStatus право на редактирование.
 * @returns подписи всех пунктов.
 */
function getSavedMenuLabels(
  editStatus: 'PENDING' | 'APPROVED' | 'DECLINED' | null,
): unknown[] {
  return getSavedSheetActionMenuItems({
    canCopy: true,
    editStatus,
    onDownload: noop,
    onDownloadPdf: noop,
    onCopy: noop,
    onRequestEdit: noop,
    onRemove: noop,
  })
    .flat()
    .map((menuItem) => menuItem.label);
}

describe('права на редактирование листа', () => {
  it('лист редактора помечен, свой — нет', () => {
    const base = { id: SHEET_ID, name: 'Гимли', data: DEFAULT_CHARACTER };

    expect(parseCharacterSheetDetail({ ...base, editor: true }).editor).toBe(
      true,
    );

    expect(parseCharacterSheetDetail(base).editor).toBe(false);
  });

  it('метка запросов приходит в списке и не ломает старый ответ', () => {
    const page = parseCharacterSheetListPage({
      limit: 8,
      sheets: [
        {
          id: SHEET_ID,
          name: 'Гимли',
          data: DEFAULT_CHARACTER,
          pendingEditRequests: 2,
        },
        { id: SAVED_ID, name: 'Леголас', data: DEFAULT_CHARACTER },
      ],
    });

    expect(page.sheets.map((sheet) => sheet.pendingEditRequests)).toEqual([
      2, 0,
    ]);
  });

  it('незнакомое право у сохранённого листа считается незапрошенным', () => {
    const base = {
      id: SAVED_ID,
      sheetId: SHEET_ID,
      shareToken: SHARE_TOKEN,
      name: 'Гимли',
      data: DEFAULT_CHARACTER,
      available: true,
    };

    expect(
      parseSavedCharacterSheet({ ...base, editStatus: 'APPROVED' }).editStatus,
    ).toBe('APPROVED');

    expect(
      parseSavedCharacterSheet({ ...base, editStatus: 'OWNER' }).editStatus,
    ).toBeNull();

    expect(parseSavedCharacterSheet(base).editStatus).toBeNull();
  });

  it('список редакторов и сводка запросов разбираются', () => {
    const list = parseSheetEditorList({
      limit: 5,
      editors: [
        {
          id: SAVED_ID,
          displayName: 'Мастер',
          avatarUrl: null,
          status: 'PENDING',
          requestedAt: '2026-10-09T10:00:00Z',
        },
      ],
    });

    expect(list.limit).toBe(5);
    expect(list.editors[0]?.status).toBe('PENDING');
    expect(parseSheetEditRequestCount({ count: 3 })).toBe(3);
  });

  it('присутствие без списка — никого нет', () => {
    expect(
      parseSheetPresence({
        users: [{ displayName: 'Мастер', avatarUrl: null }],
        version: 4,
      }),
    ).toEqual({
      users: [{ displayName: 'Мастер', avatarUrl: null }],
      version: 4,
    });

    expect(parseSheetPresence({})).toEqual({ users: [], version: null });
  });

  it('пункт запроса в меню сохранённого листа зависит от права', () => {
    expect(getSavedMenuLabels(null)).toContain(
      SHEET_EDIT_ACCESS_LABELS.request,
    );

    expect(getSavedMenuLabels('DECLINED')).toContain(
      SHEET_EDIT_ACCESS_LABELS.request,
    );

    expect(getSavedMenuLabels('PENDING')).toContain(
      SHEET_EDIT_ACCESS_LABELS.pending,
    );

    expect(getSavedMenuLabels('APPROVED')).not.toContain(
      SHEET_EDIT_ACCESS_LABELS.request,
    );

    expect(getSavedMenuLabels('APPROVED')).not.toContain(
      SHEET_EDIT_ACCESS_LABELS.pending,
    );
  });
});
