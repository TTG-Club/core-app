import { describe, expect, it } from 'vitest';

import {
  toBugReportCommentEditorValue,
  toBugReportCommentSource,
  toBugReportDescriptionBlocks,
} from '~bug-report/model';

/** Картинка в ответе модератора: маркер, которым она хранится в строке. */
const IMAGE_MARKER =
  '{@image | url:/s3/bug-report-replies/moderator/fix.webp | width:50}';

describe('ответ модератора на баг-репорт', () => {
  it('старый ответ обычным текстом раскладывается на абзацы', () => {
    expect(toBugReportCommentEditorValue('Исправили.\nСпасибо!')).toBe(
      'Исправили.\n\nСпасибо!',
    );
  });

  it('ответ с разметкой при подготовке к правке не меняется', () => {
    const statusComment = `Готово, {@b проверьте}.\n\n${IMAGE_MARKER}`;

    expect(toBugReportCommentEditorValue(statusComment)).toBe(statusComment);
  });

  it('пустой и отсутствующий ответ — пустая строка', () => {
    expect(toBugReportCommentEditorValue(undefined)).toBe('');
    expect(toBugReportCommentEditorValue(null)).toBe('');
    expect(toBugReportCommentSource('')).toBe('');
    expect(toBugReportCommentSource('  \n ')).toBe('');
  });

  it('значение редактора уходит на сервер исходником разметки', () => {
    const editorValue = JSON.stringify([
      'Готово, {@b проверьте}.',
      {
        type: 'image',
        attrs: { url: '/s3/bug-report-replies/moderator/fix.webp', width: 50 },
      },
    ]);

    expect(toBugReportCommentSource(editorValue)).toBe(
      `Готово, {@b проверьте}.\n\n${IMAGE_MARKER}`,
    );
  });

  it('нетронутый и пересохранённый ответ дают одну и ту же строку', () => {
    const statusComment = `Готово.\n\n${IMAGE_MARKER}`;
    const source = toBugReportCommentSource(statusComment);

    expect(source).toBe(statusComment);
    expect(toBugReportCommentSource(source)).toBe(source);
  });

  it('в кабинете картинка идёт отдельным блоком', () => {
    expect(toBugReportDescriptionBlocks(`Готово.\n\n${IMAGE_MARKER}`)).toEqual([
      'Готово.',
      IMAGE_MARKER,
    ]);
  });
});
