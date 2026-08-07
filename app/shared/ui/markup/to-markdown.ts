import type { MarkerNode, RenderNode } from './types';

import { MAX_DEPTH } from './consts';
import { parse } from './parser';
import {
  clampHeadingLevel,
  getNodeText,
  isBlockNode,
  isMarkerNode,
  isSimpleTextNode,
  logError,
} from './utils';

/** Символы, парные в Markdown: без экранирования текст вроде `_подчерк_` превратится в курсив. Скобки и решётка не трогаются — они безопасны в потоке текста, а экранирование сделало бы «\[PHB\]» в источнике. */
const MARKDOWN_SPECIAL_REGEXP = /([\\`*_])/g;

/** Насколько пользовательский уровень заголовка опускается: `####` уже занят названием сущности. */
const HEADING_OFFSET = 4;

/** Глубже `######` Markdown заголовки не поддерживает. */
const HEADING_MAX_LEVEL = 6;

/** Ячейка тела таблицы в структурной форме (бэкенд-AST и разбор строки-`{@table}`). */
interface TableCell {
  content?: RenderNode[];
  align?: string;
}

/** Узел таблицы со структурными полями сверх `MarkerNode` — их же читает `MarkupTable`. */
interface TableLikeNode extends MarkerNode {
  caption?: unknown;
  colLabels?: unknown[];
  colStyles?: string[];
  colAligns?: string[];
  rows?: unknown[][];
}

/**
 * Преобразует дерево разметки проекта в Markdown формата Homebrewery.
 *
 * Обходит AST, а не текст: маркеры `{@...}` бывают вложенными и с атрибутами, регуляркой они разбираются ненадёжно. Строковые узлы прогоняются через `parse()` — бэкенд присылает абзацы строками, а блочные элементы (список, таблица) уже разобранными объектами.
 *
 * @param value - Значение поля описания: массив блоков, узел или строка
 * @returns Markdown-текст; блоки разделены пустой строкой
 */
export function toMarkdown(value: unknown): string {
  return renderBlocks(Array.isArray(value) ? value : [value], 0)
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Рендерит блоки верхнего уровня (абзацы, списки, таблицы).
 *
 * Глубина считается вручную, как в `recursiveParse`: `parse()` защищён своим лимитом, но сюда приходит и готовый AST с бэкенда — он парсер минует, и circular-ссылка в нём иначе роняет страницу переполнением стека.
 */
function renderBlocks(nodes: unknown[], depth: number): string[] {
  if (depth > MAX_DEPTH) {
    logError('Markdown', 'Maximum nesting depth exceeded', { nodes });

    return [];
  }

  return nodes.flatMap((node) => {
    // Строка верхнего уровня — это абзац с инлайн-маркерами. Разбираем и склеиваем инлайном: собственных блочных детей у него быть не может.
    if (typeof node === 'string') {
      return [renderInline(parse(node), depth + 1).trim()];
    }

    if (isSimpleTextNode(node)) {
      return [node.text.replace(MARKDOWN_SPECIAL_REGEXP, '\\$1')];
    }

    if (isMarkerNode(node)) {
      return [renderBlockMarker(node, depth)];
    }

    // Массив-батч: бэкенд так хранит сгруппированные инлайн-узлы одного абзаца.
    if (Array.isArray(node)) {
      return [renderInline(node, depth + 1).trim()];
    }

    return [];
  });
}

/** Рендерит блочный маркер; неблочные маркеры на верхнем уровне остаются абзацем. */
function renderBlockMarker(node: MarkerNode, depth: number): string {
  if (node.type === 'list') {
    return renderList(node, depth);
  }

  if (node.type === 'table') {
    return renderTable(node, depth);
  }

  if (node.type === 'separator') {
    return '---';
  }

  if (node.type === 'heading') {
    // Заголовок сущности занимает `####`, поэтому пользовательские уровни 1-4 сдвигаются на ступень ниже и упираются в `######` — глубже Markdown не умеет. На странице тот же сдвиг: MarkupHeading рисует их тегами h3-h6.
    const level = Math.min(
      HEADING_MAX_LEVEL,
      clampHeadingLevel(node.attrs?.level) + HEADING_OFFSET,
    );

    return `${'#'.repeat(level)} ${renderInline(node.content ?? [], depth + 1).trim()}`;
  }

  if (node.type === 'quote') {
    return renderQuote(node, depth);
  }

  // Инлайн-маркер, оказавшийся блоком верхнего уровня (бэкенд присылает и такое), рендерится своим инлайн-правилом: иначе `{@b}` потерял бы жирность вместе с обёрткой.
  return renderMarker(node, depth);
}

/** Список: каждый пункт — строкой `- ...`. Вложенный список приходит многострочным блоком, поэтому его продолжение отбивается двумя пробелами — иначе Markdown разорвёт пункт. */
function renderList(node: MarkerNode, depth: number): string {
  return (node.content ?? [])
    .map(
      (item) =>
        `- ${renderInline(toNodes(item), depth + 1)
          .trim()
          .replace(/\n/g, '\n  ')}`,
    )
    .filter((line) => line !== '-')
    .join('\n');
}

/** Приводит значение к массиву узлов: строку разбирает парсером, одиночный узел оборачивает. */
function toNodes(value: unknown): unknown[] {
  if (typeof value === 'string') {
    return parse(value);
  }

  return Array.isArray(value) ? value : [value];
}

/** Цитата: каждая строка с префиксом `>`, между абзацами — пустая строка цитаты. */
function renderQuote(node: MarkerNode, depth: number): string {
  const body = renderQuoteBody(node.content ?? [], depth + 1);

  // Пустая строка отдаётся голым `>`, непустая — с содержимым как есть: хвостовые пробелы у неё значимы, это жёсткий перенос из `{@br}`.
  return body
    .split('\n')
    .map((line) => (line.trim() ? `> ${line}` : '>'))
    .join('\n');
}

/**
 * Тело цитаты. Содержимое приходит в трёх формах: массивом массивов (каждый вложенный — абзац), плоским инлайном из разобранной строки-`{@quote}` и смесью, где блочный узел (заголовок, список) соседствует с инлайновым текстом.
 *
 * Поэтому узлы группируются: подряд идущие инлайновые склеиваются в один абзац, блочные рендерятся сами по себе. Гнать всё через `renderBlocks` нельзя — текст и `{@b}` разъехались бы по разным абзацам; гнать всё инлайном тоже нельзя — заголовок слипся бы со следующим предложением.
 */
function renderQuoteBody(content: unknown[], depth: number): string {
  const blocks: string[] = [];

  let inline: unknown[] = [];

  const flushInline = () => {
    if (!inline.length) {
      return;
    }

    const text = renderInline(inline, depth).trim();

    if (text) {
      blocks.push(text);
    }

    inline = [];
  };

  for (const item of content) {
    // Строка внутри цитаты — такой же самостоятельный абзац, как и на верхнем уровне: соседние строки нельзя склеивать, иначе предложения слипнутся без пробела.
    if (typeof item === 'string' || Array.isArray(item) || isBlockNode(item)) {
      flushInline();
      blocks.push(...renderBlocks([item], depth).filter(Boolean));

      continue;
    }

    inline.push(item);
  }

  flushInline();

  return blocks.join('\n\n');
}

/**
 * Таблица в Markdown-пайпах. Подпись выносится жирной строкой над таблицей: в Markdown у таблицы нет своего `caption`. Ширины колонок (`w-10`) отбрасываются — переносить их некуда, а выравнивание из `text-left`/`text-center`/`text-right` ложится в строку-разделитель.
 */
function renderTable(table: TableLikeNode, depth: number): string {
  const rows = table.rows ?? [];

  const headers = (table.colLabels ?? []).map((label) =>
    renderCell(label, depth),
  );

  // Ширина берётся по САМОЙ широкой строке, а не по первой: строки приходят рваными (у `{@tr}` может быть лишний `{@td}`), и по первой строке хвосты остальных молча потерялись бы. Без заголовков Markdown-таблицы не бывает — строка-разделитель обязательна, поэтому недостающие заголовки остаются пустыми.
  const columnCount = Math.max(
    headers.length,
    ...rows.map((row) => row?.length ?? 0),
    0,
  );

  if (!columnCount) {
    return '';
  }

  const indexes = Array.from({ length: columnCount }, (_, index) => index);

  const lines = [
    toRow(indexes.map((index) => headers[index] ?? '')),
    toRow(
      indexes.map((index) =>
        toAlign(table.colAligns?.[index] || table.colStyles?.[index]),
      ),
    ),
    ...rows.map((row) =>
      toRow(indexes.map((index) => renderCell(row?.[index], depth))),
    ),
  ];

  const caption = table.caption == null ? '' : renderCell(table.caption, depth);

  return caption
    ? `${toCaption(caption)}\n\n${lines.join('\n')}`
    : lines.join('\n');
}

/** Подпись таблицы жирной строкой. Уже выделенная подпись оставляется как есть — иначе получились бы четыре звёздочки подряд. */
function toCaption(caption: string): string {
  return caption.startsWith('*') && caption.endsWith('*')
    ? caption
    : `**${caption}**`;
}

/** Собирает строку таблицы: `| a | b |`. */
function toRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

/**
 * Переводит выравнивание колонки в разделитель Markdown.
 *
 * Проверка идёт по голому слову: `colAligns` хранит `center`/`right`/`left` (их кладёт парсер из атрибута `align:`), а `colStyles` — CSS-классы вида `text-center`. Совпадение по подстроке покрывает обе формы.
 */
function toAlign(style: string | undefined): string {
  if (!style) {
    return '---';
  }

  if (style.includes('center')) {
    return ':---:';
  }

  if (style.includes('right')) {
    return '---:';
  }

  if (style.includes('left')) {
    return ':---';
  }

  return '---';
}

/** Содержимое ячейки: всегда инлайн — перенос строки оборвал бы строку таблицы, а неэкранированный `|` добавил бы лишнюю колонку (парсер намеренно оставляет литеральные пайпы, см. `convertMarker`). */
function renderCell(value: unknown, depth: number): string {
  const { content } = normalizeCell(value);

  return renderInline(toNodes(content), depth + 1)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

/** Разворачивает ячейку-объект `{ content, align }` в её содержимое. */
function normalizeCell(cell: unknown): { content: unknown } {
  if (isTableCell(cell)) {
    return { content: cell.content };
  }

  return { content: cell };
}

/** Ячейка в объектной форме: `{ content, align }` без собственного `type` (иначе это обычный узел). */
function isTableCell(cell: unknown): cell is TableCell {
  return (
    typeof cell === 'object'
    && cell !== null
    && !Array.isArray(cell)
    && 'content' in cell
    && !('type' in cell)
  );
}

/** Склеивает инлайн-узлы без разделителя. */
function renderInline(nodes: unknown[], depth: number): string {
  if (depth > MAX_DEPTH) {
    logError('Markdown', 'Maximum nesting depth exceeded', { nodes });

    return '';
  }

  return nodes.map((node) => renderNode(node, depth)).join('');
}

/** Рендерит один узел любой формы: строка, число, текстовый узел, маркер или батч. */
function renderNode(node: unknown, depth: number): string {
  if (typeof node === 'string') {
    return renderInline(parse(node), depth + 1);
  }

  // Число — legacy-форма ячейки таблицы (см. `TableRowData` в MarkupTable).
  if (typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return renderInline(node, depth + 1);
  }

  // Единственная точка выхода «сырого» текста, поэтому экранирование стоит здесь: строки, собранные самим конвертером (`**`, `` ` ``), через неё не проходят и не пострадают.
  if (isSimpleTextNode(node)) {
    return node.text.replace(MARKDOWN_SPECIAL_REGEXP, '\\$1');
  }

  if (isMarkerNode(node)) {
    return renderMarker(node, depth);
  }

  return '';
}

/** Рендерит инлайн-маркер в его Markdown-эквивалент. */
function renderMarker(node: MarkerNode, depth: number): string {
  const content = renderInline(node.content ?? [], depth + 1);

  switch (node.type) {
    case 'bold':
      return `**${content}**`;
    case 'italic':
      return `*${content}*`;
    case 'strikethrough':
      return `~~${content}~~`;
    // Бросок кубика — моноширинной плашкой: так его набирают в Homebrewery. Внутри бэктиков Markdown спецсимволы не разбирает, поэтому берётся неэкранированный текст.
    case 'roll':
      return `\`${getNodeText(node.content ?? [])}\``;
    // Два пробела перед переносом — жёсткий разрыв строки в Markdown. Без них строки склеятся в один абзац: `{@br}` разделяет реплику и подпись в цитатах.
    case 'break':
      return '  \n';
    case 'separator':
      return '\n\n---\n\n';
    case 'list':
    case 'table':
    case 'quote':
    case 'heading':
      return renderBlockMarker(node, depth);
    default:
      // Всё остальное отдаёт голый текст. Ссылки на разделы (`{@glossary ...|url:...}`) теряют адрес — в распечатанной книге он бесполезен; у подчёркивания, badge и kbd прямого аналога в Markdown нет.
      return content;
  }
}
