import type { SourceResponse } from '~/shared/types';

import { toMarkdown } from './to-markdown';
import { escapeMarkdown, MARKDOWN_NEWLINE_REGEXP } from './utils';

/**
 * Строка блока свойств: подпись и значение. Пустые значения отбрасываются
 * сборщиком.
 */
export type MarkdownStat = [label: string, value: string | undefined | null];

interface MarkdownEntityOptions {
  /** Название на русском — идёт в заголовок. */
  name: string;
  /** Название на английском — уходит в строку источника, а не в заголовок. */
  nameEng?: string;
  /**
   * Курсивная строка под заголовком: у заклинания это «3-й уровень,
   * воплощение».
   */
  subtitle?: string;
  /** Строки блока свойств в порядке вывода. */
  stats?: MarkdownStat[];
  source?: SourceResponse;
  /** Описание в разметке проекта — массив блоков либо готовый AST. */
  description?: unknown;
  /**
   * Блоки после описания: у заклинания это «накладывание более высокой
   * ячейкой».
   */
  extra?: Array<string | undefined>;
}

/**
 * Собирает сущность в Markdown формата Homebrewery — им вёрстаются
 * самодельные книги, поэтому свойства идут строками определений
 * `**Ключ** :: Значение`.
 *
 * Форма общая для всех разделов: заголовок, курсивный подзаголовок, блок
 * свойств с источником в конце, описание. Специфика раздела — только в
 * наборе `stats`.
 *
 * @param options - Части сущности
 * @returns Markdown-текст
 */
export function buildMarkdownEntity(options: MarkdownEntityOptions): string {
  const {
    name,
    subtitle,
    stats = [],
    source,
    description,
    extra = [],
  } = options;

  // Заголовок и подзаголовок идут вплотную: в Homebrewery это один
  // заголовочный блок.
  const title = escapeMarkdown(name);

  const heading = subtitle
    ? `#### ${title}\n*${escapeMarkdown(subtitle)}*`
    : `#### ${title}`;

  const rows: MarkdownStat[] = [...stats];

  if (source) {
    rows.push(['Источник', getSourceLine(source, options.nameEng)]);
  }

  return [heading, buildStatsBlock(rows), toMarkdown(description), ...extra]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Собирает блок свойств строками определений `**Ключ** :: Значение`.
 *
 * Значение свойства всегда однострочное: перенос внутри разорвал бы строку
 * определения на две, и вторая половина стала бы отдельным абзацем. Пустые
 * значения отбрасываются — рисовать «**Ключ** :: » незачем.
 *
 * @param rows - Строки свойств в порядке вывода
 * @returns Блок свойств; строки разделены переносом
 */
export function buildStatsBlock(rows: MarkdownStat[]): string {
  return rows
    .map(
      ([label, value]): MarkdownStat => [
        label,
        value?.replace(MARKDOWN_NEWLINE_REGEXP, ' ').trim(),
      ],
    )
    .filter(([, value]) => value)
    .map(([label, value]) => `**${label}** :: ${value}`)
    .join('\n');
}

/**
 * Конвертирует значение в Markdown и схлопывает переносы: строка свойства
 * должна остаться однострочной.
 *
 * @param value - Значение поля в разметке проекта
 * @returns Однострочный Markdown-текст
 */
export function toInlineValue(value: unknown): string {
  return toMarkdown(value).replace(MARKDOWN_NEWLINE_REGEXP, ' ').trim();
}

/** Источник: книга с аббревиатурой, страница и английское название сущности. */
function getSourceLine(source: SourceResponse, nameEng?: string): string {
  const { name, page } = source;

  const parts = [
    [escapeMarkdown(name.rus), name.label && `[${escapeMarkdown(name.label)}]`]
      .filter(Boolean)
      .join(' '),
    page ? `стр. ${page}` : '',
  ].filter(Boolean);

  return [parts.join(', '), escapeMarkdown(nameEng)]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Склеивает список значений в строку свойства, отбрасывая пустые. Ноль
 * значением считается: у существа это допустимый модификатор характеристики.
 */
export function joinStat(
  values: Array<string | number | undefined | null>,
  separator = ', ',
): string {
  return values
    .filter((value) => value !== undefined && value !== null && value !== '')
    .join(separator);
}
