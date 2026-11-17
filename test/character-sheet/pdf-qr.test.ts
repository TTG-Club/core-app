import type { PDFPage } from 'pdf-lib';

import { PDFDocument } from 'pdf-lib';
import { encode } from 'uqr';
import { describe, expect, it } from 'vitest';

import { PDF_PAGE_HEIGHT } from '~character-sheet/model/pdf/constants';
import { drawPdfQrCode } from '~character-sheet/model/pdf/qr';

interface DrawnRect {
  x: number;
  y: number;
  width: number;
  height: number;
  isWhite: boolean;
}

/**
 * Страница-шпион: запоминает нарисованные прямоугольники вместо отрисовки.
 *
 * @returns страница и список нарисованного.
 */
function createSpyPage(): { page: PDFPage; rects: DrawnRect[] } {
  const rects: DrawnRect[] = [];

  const page = {
    drawRectangle: (options: {
      x: number;
      y: number;
      width: number;
      height: number;
      color: { red: number };
    }) => {
      rects.push({ ...options, isWhite: options.color.red === 1 });
    },
  } as unknown as PDFPage;

  return { page, rects };
}

describe('drawPdfQrCode', () => {
  const text =
    'https://ttg.club/tools/character-sheet/shared/0b6f8f2e-3a51-4d3c-9b9e-6f1d2a7c4e10';

  const left = 500;
  const top = 22;
  const width = 40;

  it('рисует ровно ту же матрицу модулей, что выдаёт кодировщик', () => {
    const { page, rects } = createSpyPage();

    drawPdfQrCode(page, { text, left, top, width });

    const { data, size } = encode(text, { ecc: 'M', border: 1 });
    const moduleSize = width / size;
    const grid = data.map((row) => row.map(() => false));

    const [background, ...modules] = rects;

    expect(background).toMatchObject({
      x: left,
      y: PDF_PAGE_HEIGHT - top - width,
      width,
      height: width,
      isWhite: true,
    });

    for (const rect of modules) {
      expect(rect.isWhite).toBe(false);

      const row = Math.round((PDF_PAGE_HEIGHT - top - rect.y) / moduleSize) - 1;
      const start = Math.round((rect.x - left) / moduleSize);
      const length = Math.round(rect.width / moduleSize);

      for (let column = start; column < start + length; column++) {
        expect(grid[row]![column]).toBe(false);
        grid[row]![column] = true;
      }
    }

    expect(grid).toEqual(data);
  });

  it('встраивается в настоящую страницу pdf-lib', async () => {
    const document = await PDFDocument.create();
    const page = document.addPage();

    drawPdfQrCode(page, { text, left, top, width });

    expect((await document.save()).byteLength).toBeGreaterThan(0);
  });
});
