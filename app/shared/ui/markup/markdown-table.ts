/**
 * Выравнивание колонки Markdown-таблицы. Отдельным типом, а не строкой
 * разделителя: разделитель — это синтаксис, а колонка описывает смысл.
 */
export type MarkdownAlign = 'left' | 'center' | 'right';

/** Колонка Markdown-таблицы: подпись в шапке и выравнивание её значений. */
export interface MarkdownColumn {
  label: string;
  align: MarkdownAlign;
}

/** Разделители шапки по выравниванию. */
const ALIGN_SEPARATORS: Record<MarkdownAlign, string> = {
  left: ':---',
  center: ':---:',
  right: '---:',
};

/**
 * Собирает строку Markdown-таблицы: `| a | b |`.
 *
 * @param cells - Готовые значения ячеек
 * @returns Строка таблицы
 */
export function toMarkdownRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

/**
 * Собирает Markdown-таблицу целиком: шапка, строка выравниваний и тело.
 *
 * Выравнивание живёт в описании колонки, а не в отдельном массиве: иначе
 * добавленная колонка молча сдвигает выравнивание всех следующих.
 *
 * @param columns - Колонки в порядке вывода
 * @param rows - Строки тела; значения уже экранированы
 * @returns Markdown-текст таблицы
 */
export function buildMarkdownTable(
  columns: MarkdownColumn[],
  rows: string[][],
): string {
  const header = columns.map((column) => column.label);
  const separator = columns.map((column) => ALIGN_SEPARATORS[column.align]);

  return [header, separator, ...rows].map(toMarkdownRow).join('\n');
}
