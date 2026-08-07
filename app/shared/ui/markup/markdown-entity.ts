import type { SourceResponse } from '~/shared/types';

import { toMarkdown } from './to-markdown';

/** Строка блока свойств: подпись и значение. Пустые значения отбрасываются сборщиком. */
export type MarkdownStat = [label: string, value: string | undefined | null];

interface MarkdownEntityOptions {
  /** Название на русском — идёт в заголовок. */
  name: string;
  /** Название на английском — уходит в строку источника, а не в заголовок. */
  nameEng?: string;
  /** Курсивная строка под заголовком: у заклинания это «3-й уровень, воплощение». */
  subtitle?: string;
  /** Строки блока свойств в порядке вывода. */
  stats?: MarkdownStat[];
  source?: SourceResponse;
  /** Описание в разметке проекта — массив блоков либо готовый AST. */
  description?: unknown;
  /** Блоки после описания: у заклинания это «накладывание более высокой ячейкой». */
  extra?: Array<string | undefined>;
}

/**
 * Собирает сущность в Markdown формата Homebrewery — им вёрстаются самодельные книги, поэтому свойства идут строками определений `**Ключ** :: Значение`.
 *
 * Форма общая для всех разделов: заголовок, курсивный подзаголовок, блок свойств с источником в конце, описание. Специфика раздела — только в наборе `stats`.
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

  // Заголовок и подзаголовок идут вплотную: в Homebrewery это один заголовочный блок.
  const title = escapeText(name);

  const heading = subtitle
    ? `#### ${title}\n*${escapeText(subtitle)}*`
    : `#### ${title}`;

  const rows: MarkdownStat[] = [...stats];

  if (source) {
    rows.push(['Источник', getSourceLine(source, options.nameEng)]);
  }

  // Значение свойства всегда однострочное: перенос внутри разорвал бы строку определения на две, и вторая половина стала бы отдельным абзацем.
  const statsBlock = rows
    .map(
      ([label, value]): MarkdownStat => [
        label,
        value?.replace(/\s*\n\s*/g, ' ').trim(),
      ],
    )
    .filter(([, value]) => value)
    .map(([label, value]) => `**${label}** :: ${value}`)
    .join('\n');

  return [heading, statsBlock, toMarkdown(description), ...extra]
    .filter(Boolean)
    .join('\n\n');
}

/** Источник: книга с аббревиатурой, страница и английское название сущности. */
function getSourceLine(source: SourceResponse, nameEng?: string): string {
  const { name, page } = source;

  const parts = [
    [name.rus, name.label && `[${name.label}]`].filter(Boolean).join(' '),
    page ? `стр. ${page}` : '',
  ].filter(Boolean);

  return [parts.join(', '), escapeText(nameEng)].filter(Boolean).join(' · ');
}

/**
 * Экранирует парные символы Markdown в названии сущности.
 *
 * Названия приходят из данных и в разметку не оборачиваются, поэтому апостроф-бэктик (`Mordenkainen\`s Private Sanctum`) открыл бы код-спан до конца строки.
 */
function escapeText(value: string | undefined): string {
  return value ? value.replace(/([\\`*_])/g, '\\$1') : '';
}

/** Склеивает список значений в строку свойства, отбрасывая пустые. Ноль значением считается: у существа это допустимый модификатор характеристики. */
export function joinStat(
  values: Array<string | number | undefined | null>,
  separator = ', ',
): string {
  return values
    .filter((value) => value !== undefined && value !== null && value !== '')
    .join(separator);
}
