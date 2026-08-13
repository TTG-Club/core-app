import type { SourceDetailResponse } from './detail';

import { buildMarkdownEntity, escapeMarkdown, joinStat } from '~ui/markup';

/**
 * Собирает источник в Markdown формата Homebrewery.
 *
 * @param source - Источник с бэкенда
 * @returns Markdown-текст источника
 */
export function getSourceMarkdown(source: SourceDetailResponse): string {
  return buildMarkdownEntity({
    name: source.name.rus,
    nameEng: source.name.eng,
    subtitle: source.type,
    stats: [
      [
        'Издатель',
        joinStat(
          [
            escapeMarkdown(source.publisher?.name),
            escapeMarkdown(source.publisher?.date),
          ],
          ', ',
        ),
      ],
      [
        'Перевод',
        joinStat(
          [
            escapeMarkdown(source.translation?.authors),
            escapeMarkdown(source.translation?.date),
          ],
          ', ',
        ),
      ],
    ],
    source: source.source,
    description: source.description,
  });
}
