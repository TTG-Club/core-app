import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
} from '@tiptap/core';

import type { MarkerNode, RenderNode } from '~ui/markup';

import type { DeferredInlineTokens } from './block-tokenizer';

import { Extension } from '@tiptap/core';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table';

import {
  CELL_PLACEHOLDER,
  isMarkerNode,
  parse,
  serializeMarkup,
} from '~ui/markup';

import {
  createBlockMarkerTokenizer,
  deferInline,
  markerNameMatches,
} from './block-tokenizer';
import { dataAttr } from './node-utils';

const TABLE_TOKEN = 'ttgTable';

/** Имена табличного маркера (алиасов у {@table} нет). */
const TABLE_NAMES = new Set(['table']);

/** Структурная таблица, как её отдаёт parser.ts (buildTableNode). */
interface ParsedCell {
  content?: RenderNode[];
  align?: string;
}

interface ParsedTable extends MarkerNode {
  caption?: RenderNode | RenderNode[];
  colLabels?: RenderNode[];
  colStyles?: string[];
  colAligns?: string[];
  rows?: ParsedCell[][];
}

/** Разобранная ячейка редактора: ленивые инлайн-токены + атрибуты. */
interface CellData {
  isHeader: boolean;
  tokens: DeferredInlineTokens;
  style?: string;
  align?: string;
}

interface TableData {
  caption: string;
  cells: CellData[][]; // строки (первая — заголовок, если есть)
}

/**
 * Начинается ли строка ИМЕННО с `{@table` (а не `{@tablefoo}`). Экспортируется
 * для marks.ts, чтобы блочный токенайзер-чип пропускал таблицы к нативному узлу.
 */
export function isTableMarkerStart(source: string): boolean {
  return markerNameMatches(source, TABLE_NAMES);
}

function toArray(value: RenderNode | RenderNode[] | undefined): RenderNode[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

/** Инлайн-исходник узлов ячейки (join '' — как в ttg-list). */
function serializeInline(nodes: RenderNode[]): string {
  return nodes.map((node) => serializeMarkup(node)).join('');
}

/**
 * Разбирает сырой `{@table …}` в структуру ячеек с уже разобранными инлайн-
 * токенами. Возвращает undefined для пустой/битой таблицы (невалидный узел).
 */
function buildTableData(
  raw: string,
  lexer: MarkdownLexerConfiguration,
): TableData | undefined {
  const node = parse(raw).find(
    (candidate) => isMarkerNode(candidate) && candidate.type === 'table',
  ) as ParsedTable | undefined;

  if (!node) {
    return undefined;
  }

  const colLabels = node.colLabels ?? [];
  const colStyles = node.colStyles ?? [];
  const colAligns = node.colAligns ?? [];
  const bodyRows = node.rows ?? [];

  if (colLabels.length === 0 && bodyRows.length === 0) {
    return undefined;
  }

  const cells: CellData[][] = [];

  if (colLabels.length) {
    cells.push(
      colLabels.map((label, index) => ({
        isHeader: true,
        tokens: deferInline(lexer, serializeInline(toArray(label))),
        style: colStyles[index] || undefined,
        align: colAligns[index] || undefined,
      })),
    );
  }

  for (const row of bodyRows) {
    cells.push(
      row.map((cell) => ({
        isHeader: false,
        tokens: deferInline(lexer, serializeInline(cell.content ?? [])),
        align: cell.align,
      })),
    );
  }

  return { caption: serializeInline(toArray(node.caption)), cells };
}

/**
 * БЛОЧНЫЙ токенайзер `{@table …}` → нативный редактируемый узел таблицы (в отличие
 * от `ttgBlockMarker`, который делает атомарный чип). `blockMarkerMarkdownTokenizer`
 * таблицы намеренно пропускает (см. isTableMarkerStart).
 */
export const ttgTableMarkdownTokenizer = createBlockMarkerTokenizer(
  TABLE_TOKEN,
  isTableMarkerStart,
  buildTableData,
);

/**
 * Хендлер markdown для таблиц: токен `ttgTable` → нативный JSON
 * table > tableRow > (tableHeader|tableCell) > paragraph. Отдельным расширением
 * (а не на узле), т.к. один токен порождает всю структуру таблицы.
 */
export const TtgTableMarkdown = Extension.create({
  name: 'ttgTableMarkdown',

  markdownTokenName: TABLE_TOKEN,
  markdownTokenizer: ttgTableMarkdownTokenizer,
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
    const data = token as unknown as TableData;

    const rows = data.cells.map((row) =>
      helpers.createNode(
        'tableRow',
        {},
        row.map((cell) =>
          helpers.createNode(
            cell.isHeader ? 'tableHeader' : 'tableCell',
            { style: cell.style ?? null, align: cell.align ?? null },
            [
              {
                type: 'paragraph',
                content: helpers.parseInline(cell.tokens()),
              },
            ],
          ),
        ),
      ),
    );

    return helpers.createNode('table', { caption: data.caption }, rows);
  },
});

/** Инлайн-исходник содержимого ячейки (абзацы → строка, без переносов). */
function renderCellInline(
  node: JSONContent,
  helpers: MarkdownRendererHelpers,
): string {
  const blocks = Array.isArray(node.content) ? node.content : [];

  return blocks
    .map((block) => helpers.renderChildren([block]))
    .join(' ')
    .trim();
}

/**
 * Таблица: нативный редактируемый узел TipTap (вставка/строки/колонки), но
 * сериализуется/парсится через `{@table}`. Штатный GFM-парсер (`| a | b |`)
 * отключён (`parseMarkdown → []`) — источник таблиц только `{@table}`.
 */
export const TtgTable = Table.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const rows = helpers.renderChildren(
      Array.isArray(node.content) ? node.content : [],
    );

    const caption = node.attrs?.caption
      ? `{@caption ${String(node.attrs.caption)}}`
      : '';

    return `{@table ${caption}${rows}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: '',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-caption') ?? '',
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.caption
            ? { 'data-caption': String(attributes.caption) }
            : {},
      },
    };
  },
});

export const TtgTableRow = TableRow.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) =>
    `{@tr ${helpers.renderChildren(Array.isArray(node.content) ? node.content : [])}}`,
  markdownOptions: { indentsContent: false },
});

export const TtgTableHeader = TableHeader.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const style = node.attrs?.style
      ? ` | style:${String(node.attrs.style)}`
      : '';

    const align = node.attrs?.align
      ? ` | align:${String(node.attrs.align)}`
      : '';

    return `{@th ${renderCellInline(node, helpers) || CELL_PLACEHOLDER}${style}${align}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return {
      ...this.parent?.(),
      style: dataAttr('data-col-style', 'style'),
      align: dataAttr('data-align', 'align'),
    };
  },
});

export const TtgTableCell = TableCell.extend({
  parseMarkdown: () => [],
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const align = node.attrs?.align
      ? ` | align:${String(node.attrs.align)}`
      : '';

    return `{@td ${renderCellInline(node, helpers) || CELL_PLACEHOLDER}${align}}`;
  },
  markdownOptions: { indentsContent: false },
  addAttributes() {
    return { ...this.parent?.(), align: dataAttr('data-align', 'align') };
  },
});

/**
 * Набор расширений для нативных таблиц. Порядок: сперва markdown-хендлер
 * `{@table}`, затем узлы (как в ttgListExtensions).
 */
export const ttgTableExtensions = [
  TtgTableMarkdown,
  TtgTable,
  TtgTableRow,
  TtgTableCell,
  TtgTableHeader,
];
