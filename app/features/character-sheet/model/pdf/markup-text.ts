import type { MarkerNode, RenderNode } from '~ui/markup';

import type { FeatureDescriptionNode } from '../types';
import type { PdfTextBlock, PdfTextRun, PdfTextStyle } from './types';

import {
  clampHeadingLevel,
  isBlockNode,
  isMarkerNode,
  parse,
} from '~ui/markup';

import { PDF_NOTE_SEPARATOR } from './constants';

/**
 * Табличный узел разметки. Таблица держит строки и подписи столбцов рядом с
 * `content`, а базовый `MarkerNode` этих полей не описывает — их вид знает
 * только рендер таблицы, поэтому здесь они читаются как `unknown`.
 */
interface MarkupTableNode extends MarkerNode {
  colLabels?: unknown[];
  rows?: unknown[][];
}

/** Типы маркеров, переключающих начертание фрагмента. */
const MARKER_STYLES: Record<string, PdfTextStyle> = {
  bold: 'bold',
  italic: 'italic',
};

/**
 * Таблица ли это: поля строк лежат вне описанного `MarkerNode`, поэтому доступ
 * к ним открывает предикат, а не приведение типа.
 *
 * @param node узел разметки.
 * @returns true — узел является таблицей.
 */
function isTableNode(node: MarkerNode): node is MarkupTableNode {
  return node.type === 'table';
}

/**
 * Текст произвольного значения разметки: строки, числа, узлы с `text` или
 * `content`, ячейки таблицы (`{ content, align }`) и массивы всего этого.
 *
 * @param value значение неизвестной формы.
 * @returns плоский текст значения.
 */
function getUnknownText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => getUnknownText(item)).join('');
  }

  if (typeof value !== 'object' || value === null) {
    return '';
  }

  if ('text' in value) {
    return getUnknownText(value.text);
  }

  if ('content' in value) {
    return getUnknownText(value.content);
  }

  return '';
}

/**
 * Подпись маркера броска: у `{@dice}` формула лежит в содержимом, а
 * пользовательская подпись — в атрибуте `text`; в PDF бросать нечего, поэтому
 * подпись важнее формулы.
 *
 * @param node узел маркера.
 * @returns подпись из атрибута или пустая строка.
 */
function getRollLabel(node: MarkerNode): string {
  const label = node.attrs?.text;

  return typeof label === 'string' ? label : '';
}

/**
 * Фрагменты текста узла с сохранением начертания. Инлайновые маркеры (ссылки,
 * чипы разделов, бейджи) отдают свою подпись обычным текстом — в PDF им незачем
 * быть ссылками.
 *
 * @param node узел разметки или массив узлов.
 * @param style начертание, действующее на этом уровне.
 * @returns фрагменты текста.
 */
function toTextRuns(
  node: RenderNode | RenderNode[],
  style: PdfTextStyle,
): PdfTextRun[] {
  if (typeof node === 'string') {
    return [{ text: node, style }];
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => toTextRuns(child, style));
  }

  if (!isMarkerNode(node)) {
    return [{ text: node.text, style }];
  }

  if (node.type === 'break') {
    return [{ text: '\n', style }];
  }

  if (node.type === 'roll') {
    const label = getRollLabel(node);

    if (label) {
      return [{ text: label, style }];
    }
  }

  if (!node.content?.length) {
    return [];
  }

  const nestedStyle = MARKER_STYLES[node.type] ?? style;

  return node.content.flatMap((child) => toTextRuns(child, nestedStyle));
}

/**
 * Есть ли во фрагментах непробельный текст.
 *
 * @param runs фрагменты текста.
 * @returns true — блок стоит рисовать.
 */
function hasVisibleText(runs: PdfTextRun[]): boolean {
  return runs.some((run) => run.text.trim());
}

/**
 * Пустой блок заданного вида.
 *
 * @param kind вид блока.
 * @param runs фрагменты текста блока.
 * @param level уровень вложенности или заголовка.
 * @returns блок описания.
 */
function createBlock(
  kind: PdfTextBlock['kind'],
  runs: PdfTextRun[],
  level = 1,
): PdfTextBlock {
  return { kind, runs, rows: [], level };
}

/**
 * Строки таблицы: подписи столбцов идут первой строкой, дальше — данные.
 *
 * @param node табличный узел.
 * @returns строки таблицы по ячейкам.
 */
function toTableRows(node: MarkupTableNode): string[][] {
  const rows = (node.rows ?? []).map((row) =>
    row.map((cell) => getUnknownText(cell).trim()),
  );

  const labels = (node.colLabels ?? []).map((label) =>
    getUnknownText(label).trim(),
  );

  return labels.some((label) => label) ? [labels, ...rows] : rows;
}

/**
 * Элементы списка в блоки. Вложенный список внутри пункта уходит на уровень
 * глубже, остальное содержимое пункта становится его текстом.
 *
 * @param node узел списка.
 * @param level уровень вложенности (с единицы).
 * @returns блоки пунктов списка.
 */
function toListBlocks(node: MarkerNode, level: number): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];

  for (const item of node.content ?? []) {
    // Пробелы и переводы строк между пунктами приходят отдельными текстовыми
    // узлами: без этой проверки каждый такой узел рисовал бы пустой маркер.
    if (!isMarkerNode(item)) {
      const runs = toTextRuns(item, 'regular');

      if (hasVisibleText(runs)) {
        blocks.push(createBlock('listItem', runs, level));
      }

      continue;
    }

    const runs: PdfTextRun[] = [];
    const nested: PdfTextBlock[] = [];

    for (const child of item.content ?? []) {
      if (isMarkerNode(child) && child.type === 'list') {
        nested.push(...toListBlocks(child, level + 1));

        continue;
      }

      runs.push(...toTextRuns(child, 'regular'));
    }

    if (hasVisibleText(runs)) {
      blocks.push(createBlock('listItem', runs, level));
    }

    blocks.push(...nested);
  }

  return blocks;
}

/**
 * Блочный узел разметки в блоки описания.
 *
 * @param node блочный узел.
 * @returns блоки описания.
 */
function toBlocksFromBlockNode(node: MarkerNode): PdfTextBlock[] {
  if (node.type === 'separator') {
    return [createBlock('separator', [])];
  }

  if (node.type === 'heading') {
    return [
      createBlock(
        'heading',
        toTextRuns(node.content ?? [], 'bold'),
        clampHeadingLevel(node.attrs?.level),
      ),
    ];
  }

  if (node.type === 'quote') {
    return [createBlock('quote', toTextRuns(node.content ?? [], 'italic'))];
  }

  if (node.type === 'list') {
    return toListBlocks(node, 1);
  }

  if (node.type === 'li') {
    return [createBlock('listItem', toTextRuns(node.content ?? [], 'regular'))];
  }

  if (isTableNode(node)) {
    const rows = toTableRows(node);

    return rows.length ? [{ kind: 'table', runs: [], rows, level: 1 }] : [];
  }

  return [createBlock('paragraph', toTextRuns(node.content ?? [], 'regular'))];
}

/**
 * Описание из разметки сайта в блоки для PDF. Строки верхнего уровня разбираются
 * парсером разметки, блочные маркеры выносятся отдельными блоками, а идущие
 * подряд текст и инлайновые маркеры собираются в абзац — тем же порядком, каким
 * описание рисуется на сайте.
 *
 * @param nodes узлы описания из документа персонажа.
 * @returns блоки описания, готовые к отрисовке в потоке.
 */
export function toPdfTextBlocks(
  nodes: FeatureDescriptionNode[],
): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];

  for (const entry of nodes) {
    const parsedNodes = typeof entry === 'string' ? parse(entry) : [entry];

    let inlineRuns: PdfTextRun[] = [];

    /** Закрывает набранный абзац из инлайновых фрагментов. */
    const flushInline = (): void => {
      if (hasVisibleText(inlineRuns)) {
        blocks.push(createBlock('paragraph', inlineRuns));
      }

      inlineRuns = [];
    };

    for (const node of parsedNodes) {
      if (isMarkerNode(node) && isBlockNode(node)) {
        flushInline();
        blocks.push(...toBlocksFromBlockNode(node));

        continue;
      }

      inlineRuns.push(...toTextRuns(node, 'regular'));
    }

    flushInline();
  }

  return blocks;
}

/**
 * Плоский текст описания одной строкой — для мест, где на абзацы места нет
 * (подпись особенности в списке первой страницы).
 *
 * @param nodes узлы описания.
 * @returns описание одной строкой.
 */
export function toPdfPlainText(nodes: FeatureDescriptionNode[]): string {
  return toPdfTextBlocks(nodes)
    .flatMap((block) =>
      block.kind === 'table'
        ? block.rows.map((row) => row.join(PDF_NOTE_SEPARATOR))
        : [block.runs.map((run) => run.text).join('')],
    )
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
}
