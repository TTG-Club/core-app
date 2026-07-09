import type { RenderNode } from '~ui/markup';

import { getNodeText, parse, toMarkupSource } from '~ui/markup';

/**
 * Приводит поле описания записи (`preview`/`content`) к узлам разметки.
 *
 * Бэкенд непоследователен: в одних ответах описание приходит уже разобранным AST
 * (массив/узел), а в других — СЫРОЙ хранимой JSON-строкой вида `["текст"]`
 * (короткий ответ `/search`, а также `preview` в GET `/{url}` и POST `/preview`).
 * Строку разворачиваем в исходник и парсим; готовый AST отдаём как есть — иначе
 * `MarkupRender`/`getNodeText` покажут JSON-скобки и кавычки буквально.
 */
export function toArticleMarkup(value: RenderNode): RenderNode | RenderNode[] {
  return typeof value === 'string' ? parse(toMarkupSource(value)) : value;
}

/**
 * Читаемый plain-text анонса для карточек и SEO-описаний: разворачивает возможную
 * сырую JSON-строку и вытягивает текст без `{@...}`-маркеров и markdown-синтаксиса.
 */
export function getArticlePreviewText(value: RenderNode): string {
  return getNodeText(toArticleMarkup(value));
}
