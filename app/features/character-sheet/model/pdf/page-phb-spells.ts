import type { PDFPage } from 'pdf-lib';

import type { Character, CharacterSpell } from '../types';
import type { CatalogDescriptions } from './catalog';
import type { PdfBuildContext, PdfRect } from './types';

import {
  ABILITY_LABELS,
  CURRENCY_LABELS,
  CURRENCY_ORDER,
  LANGUAGE_PROFICIENCY_GROUPS,
} from '../constants';
import { isMissingInventoryItem } from '../effect-engine';
import {
  collapseProficiencies,
  getAttunementBreakdown,
  getAvailableInnateSpells,
  getPersonalityRows,
  getSpellcastingBreakdown,
  getSpellSlotRows,
  parseStoredMarkupNodes,
} from '../utils';
import { PDF_ELLIPSIS } from './constants';
import { createPdfPage, drawRule, drawTextLine } from './layout';
import { toPdfPlainText } from './markup-text';
import {
  PHB_ATTUNEMENT_ROWS,
  PHB_BOTTOM,
  PHB_COLORS,
  PHB_CONTENT_WIDTH,
  PHB_FONT_SIZES,
  PHB_GAP,
  PHB_LABELS,
  PHB_MARGIN,
  PHB_MATERIAL_COMPONENT,
  PHB_PADDING,
  PHB_QR_SIZE,
  PHB_RIGHT,
  PHB_SIDE_HEIGHTS,
  PHB_SPELL_AREA_WIDTH,
  PHB_SPELL_COLUMN_RATIOS,
  PHB_SPELL_COLUMNS,
  PHB_SPELL_CONTINUED_SUFFIX,
  PHB_SPELL_FLAGS,
  PHB_SPELL_SLOT_GRID_ROWS,
  PHB_SPELL_SLOT_LEVELS,
  PHB_SPELL_TOP_HEIGHT,
  PHB_SPELLCASTING_BOX_WIDTH,
  PHB_TABLE_ROW_HEIGHT,
  PHB_TITLES,
} from './phb-constants';
import {
  drawPhbDiamond,
  drawPhbField,
  drawPhbFrame,
  drawPhbLabel,
  drawPhbParagraph,
  drawPhbTitle,
  drawPhbValueField,
  getPhbCenteredTop,
  getPhbLineHeight,
} from './phb-layout';
import { drawPdfQrCode } from './qr';

/** Строка таблицы заклинаний, готовая к печати. */
interface SpellTableRow {
  level: string;
  name: string;
  castingTime: string;
  range: string;
  concentration: boolean;
  ritual: boolean;
  material: boolean;
  notes: string;
}

/**
 * Заговоры и подготовленные заклинания по кругам: книга персонажа и выданные
 * записями листа (вид, черта, умение класса). Неподготовленное на лист не идёт —
 * печатный лист отводит место только под то, что можно наложить сегодня.
 *
 * @param character персонаж.
 * @returns заклинания без дублей, по кругу и названию.
 */
function getSheetSpells(character: Character): CharacterSpell[] {
  const book = character.spells.filter((spell) =>
    spell.level === 0 ? spell.prepared !== false : spell.prepared === true,
  );

  // У выданных заклинаний подготовка уже разрешена сборщиком списка.
  const granted = getAvailableInnateSpells(character).filter(
    (spell) => spell.prepared,
  );

  const unique = new Map<string, CharacterSpell>();

  for (const spell of [...book, ...granted]) {
    if (!unique.has(spell.url)) {
      unique.set(spell.url, spell);
    }
  }

  return [...unique.values()].sort(
    (first, second) =>
      first.level - second.level
      || first.name.localeCompare(second.name, 'ru', { numeric: true }),
  );
}

/**
 * Строка таблицы по заклинанию: характеристики каталожного заклинания берутся
 * из дозагруженной детали, своего — из самой записи.
 *
 * @param spell заклинание.
 * @param descriptions дозагруженные описания каталога.
 * @returns строка таблицы.
 */
function toSpellTableRow(
  spell: CharacterSpell,
  descriptions: CatalogDescriptions,
): SpellTableRow {
  const detail = descriptions.spells.get(spell.url);
  const merged = detail ? { ...spell, ...detail } : spell;
  const components = merged.components ?? '';

  return {
    level: String(spell.level),
    name: spell.name,
    castingTime: merged.castingTime ?? '',
    range: merged.range ?? '',
    concentration: Boolean(spell.concentration),
    ritual: Boolean(spell.ritual),
    material: components.includes(PHB_MATERIAL_COMPONENT),
    notes: merged.duration ?? '',
  };
}

/**
 * Рамка заклинательной характеристики: сама характеристика, её модификатор,
 * сложность спасброска и бонус атаки.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawSpellcastingBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const breakdown = getSpellcastingBreakdown(character);
  const hasAbility = breakdown.ability !== null;
  const left = rect.left + PHB_PADDING + 2;
  const width = rect.width - PHB_PADDING * 2 - 4;

  drawPhbField(context, page, {
    left,
    top: rect.top + 7,
    width,
    label: PHB_TITLES.spellcastingAbility,
    value: breakdown.ability ? ABILITY_LABELS[breakdown.ability] : '',
    valueSize: PHB_FONT_SIZES.value + 1,
    valueFont: context.fonts.display,
    align: 'center',
  });

  const rows = [
    {
      label: PHB_LABELS.abilityModifier,
      value: hasAbility ? getFormattedBonus(breakdown.abilityModifier) : '',
    },
    {
      label: PHB_LABELS.spellSaveDc,
      value: hasAbility ? String(breakdown.saveDc) : '',
    },
    {
      label: PHB_LABELS.spellAttack,
      value: hasAbility ? getFormattedBonus(breakdown.attackBonus) : '',
    },
  ];

  const boxWidth = 26;
  const rowHeight = 21;

  for (const [index, row] of rows.entries()) {
    const rowTop = rect.top + 32 + rowHeight * index;

    drawPhbValueField(page, {
      left,
      top: rowTop,
      width: boxWidth,
      height: rowHeight - 4,
    });

    drawTextLine(page, {
      text: row.value,
      left,
      top: getPhbCenteredTop(
        context.fonts.bold,
        PHB_FONT_SIZES.medium - 1,
        rowTop + (rowHeight - 4) / 2,
      ),
      font: context.fonts.bold,
      size: PHB_FONT_SIZES.medium - 1,
      maxWidth: boxWidth,
      align: 'center',
    });

    drawPhbParagraph(page, {
      text: row.label,
      left: left + boxWidth + 5,
      top: rowTop + 1,
      width: width - boxWidth - 5,
      maxHeight: rowHeight - 2,
      font: context.fonts.display,
      size: 7,
      lineHeight: 8,
    });
  }
}

/**
 * Рамка ячеек заклинаний: сетка девяти кругов, в каждом — всего ячеек и ромбики
 * (закрашенные — потрачены). Ячейки договора колдуна идут в свой круг с
 * пометкой.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 * @param rect геометрия рамки.
 */
function drawSpellSlotsBox(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
  rect: PdfRect,
): void {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title: PHB_TITLES.spellSlots,
  });

  const slotRows = getSpellSlotRows(character);
  const columns = Math.ceil(PHB_SPELL_SLOT_LEVELS / PHB_SPELL_SLOT_GRID_ROWS);
  const left = rect.left + PHB_PADDING + 2;
  const width = rect.width - PHB_PADDING * 2 - 4;
  const gridTop = rect.top + 4 + titleHeight + 1;
  const cellWidth = width / columns;

  const cellHeight =
    (rect.top + rect.height - PHB_PADDING - gridTop) / PHB_SPELL_SLOT_GRID_ROWS;

  for (let level = 1; level <= PHB_SPELL_SLOT_LEVELS; level += 1) {
    const index = level - 1;
    const column = Math.floor(index / PHB_SPELL_SLOT_GRID_ROWS);
    const row = index % PHB_SPELL_SLOT_GRID_ROWS;
    const cellLeft = left + cellWidth * column;
    const cellTop = gridTop + cellHeight * row;
    const levelRows = slotRows.filter((slotRow) => slotRow.level === level);
    const total = levelRows.reduce((sum, slotRow) => sum + slotRow.max, 0);
    const isPact = levelRows.some((slotRow) => slotRow.kind === 'pact');

    drawTextLine(page, {
      text: `${level} ${PHB_LABELS.slotLevel}${isPact ? ` (${PHB_LABELS.pactSlot})` : ''}`,
      left: cellLeft,
      top: cellTop + 1,
      font: context.fonts.bold,
      size: PHB_FONT_SIZES.value - 1,
      maxWidth: cellWidth * 0.55,
    });

    drawPhbLabel(context, page, {
      text: `${PHB_LABELS.slotsTotal}: ${total || ''}`,
      left: cellLeft + cellWidth * 0.55,
      top: cellTop + 2,
      width: cellWidth * 0.45 - 3,
    });

    let markIndex = 0;

    for (const slotRow of levelRows) {
      for (let slot = 0; slot < slotRow.max; slot += 1) {
        drawPhbDiamond(
          page,
          cellLeft + 4 + markIndex * 8,
          cellTop + PHB_FONT_SIZES.value + 6,
          slot < slotRow.used,
        );

        markIndex += 1;
      }
    }

    // Пустой круг — черта под запись от руки, как на печатном листе.
    if (!total) {
      drawRule(page, {
        left: cellLeft,
        top: cellTop + PHB_FONT_SIZES.value + 9,
        width: cellWidth - 8,
        color: PHB_COLORS.line,
        thickness: 0.4,
      });
    }
  }
}

/**
 * Таблица заклинаний в рамке: шапка столбцов и строки до низа рамки. Пустые
 * строки остаются под запись от руки.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param rows строки заклинаний для этой рамки.
 * @param rect геометрия рамки.
 * @param title заголовок рамки.
 * @returns сколько строк из `rows` поместилось.
 */
function drawSpellTable(
  context: PdfBuildContext,
  page: PDFPage,
  rows: SpellTableRow[],
  rect: PdfRect,
  title: string,
): number {
  drawPhbFrame(page, rect);

  const titleHeight = drawPhbTitle(context, page, {
    left: rect.left,
    top: rect.top + 4,
    width: rect.width,
    title,
  });

  const left = rect.left + PHB_PADDING + 2;
  const width = rect.width - PHB_PADDING * 2 - 4;
  const widths = PHB_SPELL_COLUMN_RATIOS.map((ratio) => ratio * width);
  const headHeight = PHB_FONT_SIZES.label * 2 + 4;

  let cursor = rect.top + 4 + titleHeight;
  let columnLeft = left;

  for (const [index, columnTitle] of PHB_SPELL_COLUMNS.entries()) {
    const columnWidth = widths[index] ?? 0;

    drawPhbParagraph(page, {
      text: columnTitle,
      left: columnLeft,
      top: cursor,
      width: columnWidth - 3,
      maxHeight: headHeight,
      font: context.fonts.regular,
      size: PHB_FONT_SIZES.label,
      lineHeight: PHB_FONT_SIZES.label + 1,
      color: PHB_COLORS.label,
    });

    columnLeft += columnWidth;
  }

  cursor += headHeight;

  const capacity = Math.floor(
    (rect.top + rect.height - PHB_PADDING - cursor) / PHB_TABLE_ROW_HEIGHT,
  );

  const valueSize = PHB_FONT_SIZES.value - 0.5;

  for (let index = 0; index < capacity; index += 1) {
    const row = rows[index];
    const textTop = cursor + 3;

    columnLeft = left;

    const texts = row
      ? [row.level, row.name, row.castingTime, row.range, '', row.notes]
      : [];

    for (const [columnIndex, columnWidth] of widths.entries()) {
      const text = texts[columnIndex];

      if (text) {
        drawTextLine(page, {
          text,
          left: columnLeft,
          top: textTop,
          font: columnIndex === 1 ? context.fonts.bold : context.fonts.regular,
          size: columnIndex >= 2 ? PHB_FONT_SIZES.body : valueSize,
          maxWidth: columnWidth - 4,
          align: columnIndex === 0 ? 'center' : 'left',
        });
      }

      // Столбец признаков: три ромбика К, Р, М — закрашены по заклинанию.
      if (columnIndex === 4) {
        const flags = row
          ? [row.concentration, row.ritual, row.material]
          : [false, false, false];

        const step = (columnWidth - 4) / PHB_SPELL_FLAGS.length;

        for (const [flagIndex, isSet] of flags.entries()) {
          drawPhbDiamond(
            page,
            columnLeft + step * flagIndex + step / 2,
            cursor + PHB_TABLE_ROW_HEIGHT / 2,
            isSet,
            2.6,
          );
        }
      }

      columnLeft += columnWidth;
    }

    cursor += PHB_TABLE_ROW_HEIGHT;

    drawRule(page, {
      left,
      top: cursor,
      width,
      color: PHB_COLORS.line,
      thickness: 0.4,
    });
  }

  return Math.min(capacity, rows.length);
}

/**
 * Рамка с заголовком; возвращает верх области содержимого под заголовком.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param rect геометрия рамки.
 * @param title заголовок рамки.
 * @returns верх содержимого.
 */
function drawTitledFrame(
  context: PdfBuildContext,
  page: PDFPage,
  rect: PdfRect,
  title: string,
): number {
  drawPhbFrame(page, rect);

  return (
    rect.top
    + 4
    + drawPhbTitle(context, page, {
      left: rect.left,
      top: rect.top + 4,
      width: rect.width,
      title,
    })
  );
}

/**
 * Правая колонка второй страницы: внешность, биография с мировоззрением, языки,
 * снаряжение с настройкой и монеты.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param character персонаж.
 */
function drawSideColumn(
  context: PdfBuildContext,
  page: PDFPage,
  character: Character,
): void {
  const left = PHB_MARGIN + PHB_SPELL_AREA_WIDTH + PHB_GAP;
  const width = PHB_RIGHT - left;
  const innerLeft = left + PHB_PADDING + 2;
  const innerWidth = width - PHB_PADDING * 2 - 4;
  const bodySize = PHB_FONT_SIZES.value - 0.5;
  const lineHeight = getPhbLineHeight(bodySize);

  let top = PHB_MARGIN;

  // Внешность: заполненные приметы строками «подпись: значение».
  const personalityRows = getPersonalityRows(character.personality);

  const appearanceRect = {
    left,
    top,
    width,
    height: PHB_SIDE_HEIGHTS.appearance,
  };

  let cursor = drawTitledFrame(
    context,
    page,
    appearanceRect,
    PHB_TITLES.appearance,
  );

  for (const row of personalityRows) {
    if (row.key === 'alignment' || !row.filled) {
      continue;
    }

    if (cursor + lineHeight > top + appearanceRect.height - PHB_PADDING) {
      break;
    }

    drawTextLine(page, {
      text: `${row.label}: ${row.value}`,
      left: innerLeft,
      top: cursor,
      font: context.fonts.regular,
      size: bodySize,
      maxWidth: innerWidth,
    });

    cursor += lineHeight;
  }

  top += PHB_SIDE_HEIGHTS.appearance + PHB_GAP;

  // Биография: подробное описание прозой и мировоззрение внизу рамки.
  const biographyRect = {
    left,
    top,
    width,
    height: PHB_SIDE_HEIGHTS.biography,
  };

  cursor = drawTitledFrame(context, page, biographyRect, PHB_TITLES.biography);

  const alignmentHeight = 20;

  const description = toPdfPlainText(
    parseStoredMarkupNodes(character.personality.description),
  );

  drawPhbParagraph(page, {
    text: description,
    left: innerLeft,
    top: cursor,
    width: innerWidth,
    maxHeight: top + biographyRect.height - alignmentHeight - 6 - cursor,
    font: context.fonts.regular,
    size: PHB_FONT_SIZES.body,
    lineHeight: getPhbLineHeight(PHB_FONT_SIZES.body),
  });

  drawPhbField(context, page, {
    left: innerLeft,
    top: top + biographyRect.height - alignmentHeight - 3,
    width: innerWidth,
    label: PHB_LABELS.alignment,
    value: character.personality.alignment,
  });

  top += PHB_SIDE_HEIGHTS.biography + PHB_GAP;

  // Языки.
  const languagesRect = {
    left,
    top,
    width,
    height: PHB_SIDE_HEIGHTS.languages,
  };

  cursor = drawTitledFrame(context, page, languagesRect, PHB_TITLES.languages);

  drawPhbParagraph(page, {
    text: collapseProficiencies(
      character.proficiencies.languages,
      LANGUAGE_PROFICIENCY_GROUPS,
    ).join(', '),
    left: innerLeft,
    top: cursor,
    width: innerWidth,
    maxHeight: top + languagesRect.height - PHB_PADDING - cursor,
    font: context.fonts.regular,
    size: bodySize,
    lineHeight,
  });

  top += PHB_SIDE_HEIGHTS.languages + PHB_GAP;

  // Снаряжение и настройка на магические предметы.
  const coinsTop = PHB_BOTTOM - PHB_SIDE_HEIGHTS.coins;
  const equipmentRect = { left, top, width, height: coinsTop - PHB_GAP - top };

  cursor = drawTitledFrame(context, page, equipmentRect, PHB_TITLES.equipment);

  const attunement = getAttunementBreakdown(character);

  const attuned = character.inventory.filter(
    (item) => item.requiresAttunement && item.attuned,
  );

  const attunementRows = Math.max(
    PHB_ATTUNEMENT_ROWS,
    Math.min(attunement.value, 6),
    attuned.length,
  );

  const attunementRowHeight = 11;

  const attunementHeight =
    PHB_FONT_SIZES.label + 4 + attunementRows * attunementRowHeight;

  const attunementTop =
    top + equipmentRect.height - PHB_PADDING - attunementHeight;

  const items = character.inventory.filter(
    (item) => !isMissingInventoryItem(item),
  );

  const itemLineHeight = getPhbLineHeight(PHB_FONT_SIZES.body) + 0.5;

  const itemCapacity = Math.floor(
    (attunementTop - 4 - cursor) / itemLineHeight,
  );

  for (const [index, item] of items.entries()) {
    if (index >= itemCapacity) {
      break;
    }

    const isOverflow =
      index === itemCapacity - 1 && items.length > itemCapacity;

    drawTextLine(page, {
      text: isOverflow
        ? `${PHB_LABELS.moreFeatures} ${items.length - index}${PDF_ELLIPSIS}`
        : `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`,
      left: innerLeft,
      top: cursor,
      font: isOverflow ? context.fonts.italic : context.fonts.regular,
      size: PHB_FONT_SIZES.body,
      color: isOverflow ? PHB_COLORS.label : PHB_COLORS.ink,
      maxWidth: innerWidth,
    });

    cursor += itemLineHeight;
  }

  drawPhbLabel(context, page, {
    text: PHB_LABELS.attunement,
    left: innerLeft,
    top: attunementTop,
    width: innerWidth,
  });

  for (let index = 0; index < attunementRows; index += 1) {
    const rowTop =
      attunementTop + PHB_FONT_SIZES.label + 4 + index * attunementRowHeight;

    const item = attuned[index];

    drawPhbDiamond(page, innerLeft + 4, rowTop + 4, Boolean(item));

    if (item) {
      drawTextLine(page, {
        text: item.name,
        left: innerLeft + 11,
        top: rowTop,
        font: context.fonts.regular,
        size: PHB_FONT_SIZES.body,
        maxWidth: innerWidth - 11,
      });
    }

    drawRule(page, {
      left: innerLeft + 10,
      top: rowTop + 9,
      width: innerWidth - 10,
      color: PHB_COLORS.line,
      thickness: 0.4,
    });
  }

  // Монеты: пять полей по номиналам.
  const coinsRect = {
    left,
    top: coinsTop,
    width,
    height: PHB_SIDE_HEIGHTS.coins,
  };

  cursor = drawTitledFrame(context, page, coinsRect, PHB_TITLES.coins);

  const coinGap = 3;

  const coinWidth =
    (innerWidth - coinGap * (CURRENCY_ORDER.length - 1))
    / CURRENCY_ORDER.length;

  for (const [index, key] of CURRENCY_ORDER.entries()) {
    const coinLeft = innerLeft + (coinWidth + coinGap) * index;

    drawPhbLabel(context, page, {
      text: CURRENCY_LABELS[key],
      left: coinLeft,
      top: cursor,
      width: coinWidth,
      align: 'center',
    });

    const fieldRect = {
      left: coinLeft,
      top: cursor + PHB_FONT_SIZES.label + 2,
      width: coinWidth,
      height: 16,
    };

    drawPhbValueField(page, fieldRect);

    drawTextLine(page, {
      text: String(character.currency[key]),
      left: fieldRect.left,
      top: getPhbCenteredTop(
        context.fonts.bold,
        PHB_FONT_SIZES.value,
        fieldRect.top + fieldRect.height / 2,
      ),
      font: context.fonts.bold,
      size: PHB_FONT_SIZES.value,
      maxWidth: fieldRect.width - 2,
      align: 'center',
    });
  }
}

/**
 * Вторая страница листа PHB: заклинательство, ячейки, таблица заговоров и
 * подготовленных заклинаний, а справа — внешность, биография, языки,
 * снаряжение и монеты. Не влезшие в таблицу заклинания продолжаются на
 * отдельных страницах той же таблицей во всю ширину.
 *
 * @param context документ в процессе сборки.
 * @param character персонаж.
 * @param descriptions дозагруженные описания каталога.
 */
export function drawPhbSpellsPage(
  context: PdfBuildContext,
  character: Character,
  descriptions: CatalogDescriptions,
): void {
  const page = createPdfPage(context);
  const top = PHB_MARGIN;

  drawSpellcastingBox(context, page, character, {
    left: PHB_MARGIN,
    top,
    width: PHB_SPELLCASTING_BOX_WIDTH,
    height: PHB_SPELL_TOP_HEIGHT,
  });

  let slotsLeft = PHB_MARGIN + PHB_SPELLCASTING_BOX_WIDTH + PHB_GAP;

  // QR-код со ссылкой на лист — между заклинательством и ячейками, на месте
  // иллюстрации печатного листа.
  if (context.shareUrl) {
    drawPdfQrCode(page, {
      text: context.shareUrl,
      left: slotsLeft,
      top: top + (PHB_SPELL_TOP_HEIGHT - PHB_QR_SIZE) / 2,
      width: PHB_QR_SIZE,
    });

    slotsLeft += PHB_QR_SIZE + PHB_GAP;
  }

  drawSpellSlotsBox(context, page, character, {
    left: slotsLeft,
    top,
    width: PHB_MARGIN + PHB_SPELL_AREA_WIDTH - slotsLeft,
    height: PHB_SPELL_TOP_HEIGHT,
  });

  const rows = getSheetSpells(character).map((spell) =>
    toSpellTableRow(spell, descriptions),
  );

  const tableTop = top + PHB_SPELL_TOP_HEIGHT + PHB_GAP;

  let printed = drawSpellTable(
    context,
    page,
    rows,
    {
      left: PHB_MARGIN,
      top: tableTop,
      width: PHB_SPELL_AREA_WIDTH,
      height: PHB_BOTTOM - tableTop,
    },
    PHB_TITLES.spells,
  );

  drawSideColumn(context, page, character);

  while (printed < rows.length) {
    const continuationPage = createPdfPage(context);

    const added = drawSpellTable(
      context,
      continuationPage,
      rows.slice(printed),
      {
        left: PHB_MARGIN,
        top: PHB_MARGIN,
        width: PHB_CONTENT_WIDTH,
        height: PHB_BOTTOM - PHB_MARGIN,
      },
      `${PHB_TITLES.spells}${PHB_SPELL_CONTINUED_SUFFIX}`,
    );

    // Страница без единой строки означала бы вечный цикл — выходим.
    if (!added) {
      break;
    }

    printed += added;
  }
}
