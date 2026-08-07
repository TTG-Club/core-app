import type { FeatDetailResponse } from './detail';

import { buildMarkdownEntity, joinStat } from '~ui/markup';

/**
 * Собирает черту в Markdown формата Homebrewery.
 *
 * @param feat - Черта с бэкенда
 * @returns Markdown-текст черты
 */
export function getFeatMarkdown(feat: FeatDetailResponse): string {
  return buildMarkdownEntity({
    name: feat.name.rus,
    nameEng: feat.name.eng,
    subtitle: feat.category,
    stats: [
      ['Требование', feat.prerequisite],
      [
        'Предыстории',
        joinStat(feat.backgrounds?.map((item) => item.name) ?? []),
      ],
    ],
    source: feat.source,
    description: feat.description,
  });
}
