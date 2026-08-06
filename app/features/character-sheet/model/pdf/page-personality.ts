import type { Character } from '../types';
import type { PdfBuildContext } from './types';

import { getPersonalityRows, parseStoredMarkupNodes } from '../utils';
import {
  PDF_CONTENT_WIDTH,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_PAGE_MARGIN,
  PDF_PERSONALITY_BOX_HEIGHT,
  PDF_PERSONALITY_COLUMNS,
  PDF_TITLES,
} from './constants';
import {
  createPdfFlow,
  drawSectionHeader,
  drawTextBlocks,
  drawValueBox,
} from './layout';
import { toPdfTextBlocks } from './markup-text';

/**
 * Страница личности: приметы с мировоззрением боксами и подробное описание
 * прозой. Предыстория сюда не идёт — она уже стоит в подзаголовке первой
 * страницы рядом с видом и классом.
 *
 * Страница не создаётся, пока личность не заполнена: пустые боксы под запись от
 * руки хороши на непустом листе, а целая страница ради них — нет.
 *
 * @param context документ в процессе сборки.
 * @param character персонаж.
 */
export function drawPersonalityPage(
  context: PdfBuildContext,
  character: Character,
): void {
  const rows = getPersonalityRows(character.personality);

  const descriptionBlocks = toPdfTextBlocks(
    parseStoredMarkupNodes(character.personality.description),
  );

  if (!rows.some((row) => row.filled) && !descriptionBlocks.length) {
    return;
  }

  const flow = createPdfFlow(context, {
    left: PDF_PAGE_MARGIN,
    width: PDF_CONTENT_WIDTH,
    top: PDF_PAGE_MARGIN,
  });

  drawSectionHeader(context, flow, PDF_TITLES.personality);

  const boxWidth =
    (flow.width - PDF_GAP * (PDF_PERSONALITY_COLUMNS - 1))
    / PDF_PERSONALITY_COLUMNS;

  for (const [index, row] of rows.entries()) {
    const column = index % PDF_PERSONALITY_COLUMNS;
    const line = Math.floor(index / PDF_PERSONALITY_COLUMNS);

    drawValueBox(context, flow.page, {
      left: flow.left + (boxWidth + PDF_GAP) * column,
      top: flow.top + (PDF_PERSONALITY_BOX_HEIGHT + PDF_GAP) * line,
      width: boxWidth,
      height: PDF_PERSONALITY_BOX_HEIGHT,
      label: row.label,
      // Прочерк с плитки листа в бумажный бокс не переносится: пустой бокс
      // заполняют от руки, а «—» этому только мешает.
      value: row.filled ? row.value : '',
      // Кегль строки списка, а не крупного значения: мировоззрения приходят из
      // словаря сайта целыми словами, и самое длинное («Законопослушный
      // Нейтральный») крупным кеглем в бокс не влезает — его обрезало бы
      // многоточием. Мелким остаётся запас даже на нём.
      valueSize: PDF_FONT_SIZES.value,
    });
  }

  const lines = Math.ceil(rows.length / PDF_PERSONALITY_COLUMNS);

  flow.advance((PDF_PERSONALITY_BOX_HEIGHT + PDF_GAP) * lines);

  if (!descriptionBlocks.length) {
    return;
  }

  flow.advance(PDF_GAP * 0.5);
  drawSectionHeader(context, flow, PDF_TITLES.personalityDescription);
  drawTextBlocks(context, flow, descriptionBlocks);
}
