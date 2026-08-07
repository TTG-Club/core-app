import type { GlossaryDetailResponse } from './detail';

import { buildMarkdownEntity } from '~ui/markup';

/**
 * Собирает статью глоссария в Markdown формата Homebrewery.
 *
 * @param glossary - Статья глоссария с бэкенда
 * @returns Markdown-текст статьи
 */
export function getGlossaryMarkdown(glossary: GlossaryDetailResponse): string {
  return buildMarkdownEntity({
    name: glossary.name.rus,
    nameEng: glossary.name.eng,
    subtitle: glossary.tagCategory,
    source: glossary.source,
    description: glossary.description,
  });
}
