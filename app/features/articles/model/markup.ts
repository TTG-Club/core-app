import type { MarkupHeadingAnchor, RenderNode } from '~ui/markup';

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

/** Пункт содержания статьи для `UContentToc`. */
export interface ArticleTocLink {
  id: string;
  text: string;
  depth: number;
  children?: Array<ArticleTocLink>;
}

/**
 * Складывает плоский список заголовков статьи в дерево для содержания: каждый
 * заголовок становится вложенным пунктом ближайшего выше заголовка с меньшим
 * уровнем. Пропуск уровня (после `level:1` сразу `level:3`) вкладывает пункт
 * на один шаг, а не на два.
 *
 * @param headings - Заголовки в порядке появления в тексте
 * @returns Пункты верхнего уровня с вложенными подпунктами
 */
export function buildArticleTocLinks(
  headings: Array<MarkupHeadingAnchor>,
): Array<ArticleTocLink> {
  const rootLinks: Array<ArticleTocLink> = [];
  const parents: Array<{ level: number; link: ArticleTocLink }> = [];

  for (const heading of headings) {
    let parent = parents.at(-1);

    while (parent && parent.level >= heading.level) {
      parents.pop();
      parent = parents.at(-1);
    }

    const link: ArticleTocLink = {
      id: heading.id,
      text: heading.text,
      depth: parents.length + 1,
    };

    if (parent) {
      parent.link.children = [...(parent.link.children ?? []), link];
    } else {
      rootLinks.push(link);
    }

    parents.push({ level: heading.level, link });
  }

  return rootLinks;
}
