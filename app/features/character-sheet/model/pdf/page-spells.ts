import type { Character, CharacterSpell } from '../types';
import type { PdfBuildContext, PdfFlow, PdfTableColumn } from './types';

import {
  INNATE_SPELL_GROUP_LABEL,
  INNATE_SPELL_GROUP_LEVEL,
  RESOURCE_RECOVERY_LABELS,
} from '../constants';
import {
  getClassGrantedSpells,
  getInnateSpells,
  getSpellGroups,
  getSpellLevelLabel,
  getSpellSlotCircles,
  getSpellSlotRows,
} from '../utils';
import {
  PDF_COLORS,
  PDF_CONTENT_WIDTH,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_MARK_RADIUS,
  PDF_PAGE_MARGIN,
  PDF_ROW_HEIGHT,
  PDF_SPELL_COLUMN_RATIOS,
  PDF_SPELL_COLUMNS,
  PDF_SPELL_LABELS,
  PDF_SPELL_MARK_COLUMN_WIDTH,
  PDF_TITLES,
} from './constants';
import {
  createPdfFlow,
  drawMark,
  drawSectionHeader,
  drawTableHead,
  drawTableRow,
  drawTextLine,
} from './layout';

/**
 * Столбцы таблицы заклинаний: первый столбец — кружок подготовки.
 *
 * @returns столбцы таблицы.
 */
function getSpellColumns(): PdfTableColumn[] {
  const nameWidth = PDF_CONTENT_WIDTH * PDF_SPELL_COLUMN_RATIOS.name;
  const schoolWidth = PDF_CONTENT_WIDTH * PDF_SPELL_COLUMN_RATIOS.school;

  return [
    { title: '', width: PDF_SPELL_MARK_COLUMN_WIDTH, align: 'center' },
    { title: PDF_SPELL_COLUMNS.name, width: nameWidth, align: 'left' },
    { title: PDF_SPELL_COLUMNS.school, width: schoolWidth, align: 'left' },
    {
      title: PDF_SPELL_COLUMNS.notes,
      width:
        PDF_CONTENT_WIDTH
        - PDF_SPELL_MARK_COLUMN_WIDTH
        - nameWidth
        - schoolWidth,
      align: 'left',
    },
  ];
}

/**
 * Свойства заклинания строкой: концентрация и ритуал.
 *
 * @param spell заклинание книги.
 * @returns подписи свойств через запятую.
 */
function getSpellNotes(spell: CharacterSpell): string {
  const notes: string[] = [];

  if (spell.concentration) {
    notes.push(PDF_SPELL_LABELS.concentration);
  }

  if (spell.ritual) {
    notes.push(PDF_SPELL_LABELS.ritual);
  }

  return notes.join(', ');
}

/**
 * Ряды ячеек заклинаний: круг, кружки по числу ячеек (закрашенные — потрачены)
 * и способ восстановления.
 *
 * @param context документ в процессе сборки.
 * @param character персонаж.
 * @param flow поток содержимого.
 */
function drawSpellSlots(
  context: PdfBuildContext,
  character: Character,
  flow: PdfFlow,
): void {
  const rows = getSpellSlotRows(character);

  if (!rows.length) {
    return;
  }

  drawSectionHeader(context, flow, PDF_TITLES.spellSlots);

  for (const row of rows) {
    flow.ensure(PDF_ROW_HEIGHT);

    drawTextLine(flow.page, {
      text: getSpellLevelLabel(row.level),
      left: flow.left,
      top: flow.top + 1,
      font: context.fonts.bold,
      size: PDF_FONT_SIZES.value,
      maxWidth: 48,
    });

    for (const circle of getSpellSlotCircles(row)) {
      drawMark(flow.page, {
        centerLeft: flow.left + 56 + circle.index * (PDF_MARK_RADIUS * 2 + 4),
        centerTop: flow.top + PDF_ROW_HEIGHT / 2,
        fill: circle.used ? 'full' : 'none',
      });
    }

    drawTextLine(flow.page, {
      text: RESOURCE_RECOVERY_LABELS[row.recovery],
      left: flow.left + flow.width - 120,
      top: flow.top + 1,
      font: context.fonts.regular,
      size: PDF_FONT_SIZES.value,
      color: PDF_COLORS.muted,
      maxWidth: 120,
      align: 'right',
    });

    flow.advance(PDF_ROW_HEIGHT);
  }

  flow.advance(PDF_GAP);
}

/**
 * Страница заклинаний: ячейки по кругам и книга заклинаний по кругам. Страница
 * не создаётся, если персонаж не заклинатель и заклинаний у него нет.
 *
 * @param context документ в процессе сборки.
 * @param character персонаж.
 */
export function drawSpellsPage(
  context: PdfBuildContext,
  character: Character,
): void {
  const slotRows = getSpellSlotRows(character);
  const innateSpells = getInnateSpells(character);

  // Заклинания классовых умений идут в кругах вместе с книгой — как на листе.
  // Уже заведённое в книге вторым рядом не печатается
  const bookUrls = new Set(character.spells.map((spell) => spell.url));

  const bookSpells = [
    ...character.spells,
    ...getClassGrantedSpells(character).filter(
      (spell) => !bookUrls.has(spell.url),
    ),
  ];

  if (!bookSpells.length && !innateSpells.length && !slotRows.length) {
    return;
  }

  const flow = createPdfFlow(context, {
    left: PDF_PAGE_MARGIN,
    width: PDF_CONTENT_WIDTH,
    top: PDF_PAGE_MARGIN,
  });

  drawSpellSlots(context, character, flow);

  if (!bookSpells.length && !innateSpells.length) {
    return;
  }

  drawSectionHeader(context, flow, PDF_TITLES.spells);

  const columns = getSpellColumns();

  drawTableHead(context, flow, columns);

  const groups = [
    ...(innateSpells.length
      ? [
          {
            level: INNATE_SPELL_GROUP_LEVEL,
            label: INNATE_SPELL_GROUP_LABEL,
            spells: innateSpells,
          },
        ]
      : []),
    ...getSpellGroups(
      bookSpells,
      slotRows.map((row) => row.level),
    ),
  ];

  for (const group of groups) {
    if (!group.spells.length) {
      continue;
    }

    if (flow.ensure(PDF_ROW_HEIGHT * 2)) {
      drawSectionHeader(context, flow, PDF_TITLES.spells, true);
      drawTableHead(context, flow, columns);
    }

    drawTableRow(context, flow, columns, ['', group.label], { bold: true });

    for (const spell of group.spells) {
      if (flow.ensure(PDF_ROW_HEIGHT)) {
        drawSectionHeader(context, flow, PDF_TITLES.spells, true);
        drawTableHead(context, flow, columns);
      }

      // Кружок подготовки рисуется до строки, но после проверки места: иначе
      // перенос страницы внутри строки оставил бы кружок на прошлой странице.
      drawMark(flow.page, {
        centerLeft: flow.left + PDF_SPELL_MARK_COLUMN_WIDTH / 2,
        centerTop: flow.top + PDF_ROW_HEIGHT / 2,
        fill: 'none',
      });

      drawTableRow(context, flow, columns, [
        '',
        spell.name,
        spell.school,
        getSpellNotes(spell),
      ]);
    }
  }
}
