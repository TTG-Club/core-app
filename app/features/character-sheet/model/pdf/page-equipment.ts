import type { Character, CharacterInventoryItem } from '../types';
import type { PdfBuildContext, PdfTableColumn } from './types';

import {
  CURRENCY_LABELS,
  CURRENCY_ORDER,
  WEIGHT_UNIT_LABEL,
} from '../constants';
import {
  getCarryingCapacityValue,
  getInventoryGroups,
  getInventoryWeight,
  parseStoredMarkupNodes,
} from '../utils';
import {
  PDF_ATTUNEMENT_MARKS,
  PDF_COIN_BOX_HEIGHT,
  PDF_CONTENT_WIDTH,
  PDF_EQUIPMENT_COLUMN_RATIOS,
  PDF_EQUIPMENT_COLUMNS,
  PDF_EQUIPMENT_MIN_ROWS,
  PDF_EQUIPPED_MARK,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_LABELS,
  PDF_PAGE_MARGIN,
  PDF_ROW_HEIGHT,
  PDF_TITLES,
} from './constants';
import {
  createPdfFlow,
  drawSectionHeader,
  drawTableHead,
  drawTableRow,
  drawTextBlocks,
  drawValueBox,
} from './layout';
import { toPdfHeadingBlock, toPdfTextBlocks } from './markup-text';

/**
 * Название предмета для таблицы: предмету с настройкой она приписывается прямо
 * к названию — на бумаге сверяться с меню листа не с чем.
 *
 * @param inventoryItem предмет инвентаря.
 * @returns название предмета для строки таблицы.
 */
function getEquipmentItemName(inventoryItem: CharacterInventoryItem): string {
  if (!inventoryItem.requiresAttunement) {
    return inventoryItem.name;
  }

  const mark = inventoryItem.attuned
    ? PDF_ATTUNEMENT_MARKS.attuned
    : PDF_ATTUNEMENT_MARKS.required;

  return `${inventoryItem.name} (${mark})`;
}

/**
 * Столбцы таблицы снаряжения.
 *
 * @returns столбцы с шириной по доле содержимого страницы.
 */
function getEquipmentColumns(): PdfTableColumn[] {
  return [
    {
      title: PDF_EQUIPMENT_COLUMNS.name,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.name,
      align: 'left',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.quantity,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.quantity,
      align: 'center',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.weight,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.weight,
      align: 'right',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.cost,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.cost,
      align: 'right',
    },
    {
      title: PDF_EQUIPMENT_COLUMNS.equipped,
      width: PDF_CONTENT_WIDTH * PDF_EQUIPMENT_COLUMN_RATIOS.equipped,
      align: 'center',
    },
  ];
}

/**
 * Страница снаряжения: монеты, вес, таблица предметов по категориям и заметки
 * игрока. Длинные списки продолжаются на следующих страницах.
 *
 * @param context документ в процессе сборки.
 * @param character персонаж.
 */
export function drawEquipmentPage(
  context: PdfBuildContext,
  character: Character,
): void {
  const flow = createPdfFlow(context, {
    left: PDF_PAGE_MARGIN,
    width: PDF_CONTENT_WIDTH,
    top: PDF_PAGE_MARGIN,
  });

  drawSectionHeader(context, flow, PDF_TITLES.coins);

  const coins = [
    ...CURRENCY_ORDER.map((key) => ({
      label: CURRENCY_LABELS[key],
      value: String(character.currency[key]),
    })),
    ...character.customCurrencies.map((currency) => ({
      label: currency.label || currency.name,
      value: String(currency.amount),
    })),
  ];

  const coinWidth =
    (flow.width - PDF_GAP * (coins.length - 1)) / Math.max(coins.length, 1);

  for (const [index, coin] of coins.entries()) {
    drawValueBox(context, flow.page, {
      left: flow.left + (coinWidth + PDF_GAP) * index,
      top: flow.top,
      width: coinWidth,
      height: PDF_COIN_BOX_HEIGHT,
      label: coin.label,
      value: coin.value,
      valueSize: PDF_FONT_SIZES.mediumValue + 2,
    });
  }

  flow.advance(PDF_COIN_BOX_HEIGHT + PDF_GAP * 1.5);

  drawSectionHeader(context, flow, PDF_TITLES.equipment);

  const carried = getInventoryWeight(character.inventory, character.currency);

  const capacity = getCarryingCapacityValue(character);

  const columns = getEquipmentColumns();

  drawTableRow(
    context,
    flow,
    columns,
    [
      `${PDF_LABELS.carried}: ${carried} ${WEIGHT_UNIT_LABEL}`,
      '',
      '',
      `${PDF_LABELS.capacity}: ${capacity} ${WEIGHT_UNIT_LABEL}`,
      '',
    ],
    { bold: true, divider: false },
  );

  drawTableHead(context, flow, columns);

  const groups = getInventoryGroups(character.inventory);

  let rowCount = 0;

  for (const group of groups) {
    if (flow.ensure(PDF_ROW_HEIGHT * 2)) {
      drawSectionHeader(context, flow, PDF_TITLES.equipment, true);
      drawTableHead(context, flow, columns);
    }

    drawTableRow(context, flow, columns, [group.title, '', '', '', ''], {
      bold: true,
    });

    rowCount += 1;

    for (const item of group.items) {
      if (flow.ensure(PDF_ROW_HEIGHT)) {
        drawSectionHeader(context, flow, PDF_TITLES.equipment, true);
        drawTableHead(context, flow, columns);
      }

      drawTableRow(context, flow, columns, [
        getEquipmentItemName(item),
        String(item.quantity),
        item.weight ? `${item.weight} ${WEIGHT_UNIT_LABEL}` : '',
        item.cost,
        item.equipped ? PDF_EQUIPPED_MARK : '',
      ]);

      rowCount += 1;
    }
  }

  // Пустые строки под запись от руки: в бумажном листе снаряжение дописывают
  // ручкой, поэтому короткий инвентарь не должен обрываться сразу под шапкой.
  for (let index = rowCount; index < PDF_EQUIPMENT_MIN_ROWS; index += 1) {
    drawTableRow(context, flow, columns, []);
  }

  // Заметки идут записями: название каждой рисуется заголовком над её текстом.
  const noteBlocks = character.notes.flatMap((note) => [
    ...(note.title ? [toPdfHeadingBlock(note.title)] : []),
    ...toPdfTextBlocks(parseStoredMarkupNodes(note.content)),
  ]);

  if (!noteBlocks.length) {
    return;
  }

  flow.advance(PDF_GAP * 1.5);
  drawSectionHeader(context, flow, PDF_TITLES.notes);
  drawTextBlocks(context, flow, noteBlocks);
}
