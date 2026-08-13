import type { ArticleDetailedResponse } from './types';

import { buildMarkdownEntity, toMarkdown } from '~ui/markup';

import { toArticleMarkup } from './markup';

/**
 * Собирает статью или новость в Markdown формата Homebrewery.
 *
 * Анонс идёт вступительным абзацем, содержание — следом: на странице они
 * разделены так же. Оба поля бэкенд отдаёт то разобранным AST, то сырой
 * строкой, поэтому проходят через `toArticleMarkup`, как и в `ArticleBody`.
 *
 * Дата публикации в текст не попадает: она относится к записи на сайте, а не
 * к её содержимому.
 *
 * @param article - Запись с бэкенда
 * @returns Markdown-текст записи
 */
export function getArticleMarkdown(article: ArticleDetailedResponse): string {
  return buildMarkdownEntity({
    name: article.title,
    subtitle: article.typeName,
    description: toArticleMarkup(article.preview),
    extra: [toMarkdown(toArticleMarkup(article.content))],
  });
}
