import type { SourceDetailResponse } from './detail';

import { buildMarkdownEntity, joinStat } from '~ui/markup';

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
        joinStat([source.publisher?.name, source.publisher?.date], ', '),
      ],
      [
        'Перевод',
        joinStat([source.translation?.authors, source.translation?.date], ', '),
      ],
    ],
    source: source.source,
    description: source.description,
  });
}
