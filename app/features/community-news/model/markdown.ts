import type { CommunityNewsDetailedResponse } from './types';

import { toArticleMarkup } from '~articles/model';
import { buildMarkdownEntity, toMarkdown } from '~ui/markup';

/**
 * Собирает новость сообщества в Markdown формата Homebrewery: автор —
 * подзаголовком, текст — следом.
 *
 * @param news - Новость с бэкенда
 * @returns Markdown-текст новости
 */
export function getCommunityNewsMarkdown(
  news: CommunityNewsDetailedResponse,
): string {
  return buildMarkdownEntity({
    name: news.title,
    subtitle: news.authorName ?? undefined,
    extra: [toMarkdown(toArticleMarkup(news.content))],
  });
}
