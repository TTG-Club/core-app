import type { MagicItemDetailResponse } from './detail';

import { buildMarkdownEntity } from '~ui/markup';

/**
 * Собирает магический предмет в Markdown формата Homebrewery.
 *
 * @param magicItem - Магический предмет с бэкенда
 * @returns Markdown-текст предмета
 */
export function getMagicItemMarkdown(
  magicItem: MagicItemDetailResponse,
): string {
  return buildMarkdownEntity({
    name: magicItem.name.rus,
    nameEng: magicItem.name.eng,
    subtitle: magicItem.subtitle,
    source: magicItem.source,
    description: magicItem.description,
  });
}
