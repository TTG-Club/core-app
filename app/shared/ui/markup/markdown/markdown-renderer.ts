import type { VNode } from 'vue';

import { createTextVNode, h } from 'vue';

import { parse } from '../parser';
import { render as renderMarkerNodes } from '../renderer';
import { logError } from '../utils';
import { markdownIt } from './instance';
import { MARKER_TOKEN } from './marker-plugin';

type Token = ReturnType<typeof markdownIt.parse>[number];

interface TokenCursor {
  index: number;
}

/**
 * Возвращает имя закрывающего токена для открывающего (paragraph_open →
 * paragraph_close).
 */
function closeTypeOf(openType: string): string {
  return openType.replace(/_open$/, '_close');
}

/**
 * Подбирает Tailwind-классы заголовка по его уровню (h1–h6), сохраняя единую
 * типографику с остальной разметкой.
 */
function headingClass(tag: string): string {
  const base = 'font-semibold text-default tracking-tight';

  switch (tag) {
    case 'h1':
      return `${base} text-2xl mt-6 mb-3 border-b border-default pb-2`;
    case 'h2':
      return `${base} text-xl mt-6 mb-3 border-b border-default pb-2`;
    case 'h3':
      return `${base} text-lg mt-5 mb-2`;
    case 'h4':
      return `${base} text-base mt-4 mb-2`;
    case 'h5':
      return `${base} text-sm mt-3 mb-1`;
    default:
      return `${base} text-sm mt-3 mb-1 uppercase tracking-wide`;
  }
}

/**
 * Разбирает и рендерит сырой маркер {@...} через существующий парсер разметки.
 * При ошибке маркера показывает его исходный текст, не ломая весь блок.
 */
function renderMarker(raw: string): VNode[] {
  try {
    return renderMarkerNodes(parse(raw));
  } catch (err) {
    logError('Markdown', 'Marker render error', { raw, err });

    return [createTextVNode(raw)];
  }
}

/**
 * Рендерит листовой (не контейнерный) инлайновый токен в VNode-массив.
 */
function renderInlineLeaf(token: Token): VNode[] {
  switch (token.type) {
    case 'text':
      return token.content ? [createTextVNode(token.content)] : [];
    case MARKER_TOKEN:
      return renderMarker(token.content);
    case 'softbreak':
    case 'hardbreak':
      return [h('br')];
    case 'code_inline':
      return [
        h(
          'code',
          { class: 'rounded bg-elevated px-1 py-0.5 font-mono text-sm' },
          token.content,
        ),
      ];
    case 'image':
      return [
        h('img', {
          src: token.attrGet('src'),
          alt: token.content,
          class: 'my-2 max-w-full rounded',
          loading: 'lazy',
        }),
      ];
    // При html: false «сырой» HTML приходит как экранированный текст.
    case 'html_inline':
      return token.content ? [createTextVNode(token.content)] : [];
    default:
      return [];
  }
}

/**
 * Оборачивает дочерние VNode в контейнерный инлайновый элемент (strong, em, s,
 * ссылка).
 */
function renderInlineContainer(token: Token, children: VNode[]): VNode {
  switch (token.type) {
    case 'strong_open':
      return h('strong', { class: 'font-semibold text-default' }, children);
    case 'em_open':
      return h('em', children);
    case 's_open':
      return h('s', children);
    case 'link_open': {
      const href = token.attrGet('href') ?? '';
      const isExternal = /^[a-z][\w+.-]*:/i.test(href) && !href.startsWith('/');

      return h(
        'a',
        {
          href,
          class:
            'text-link underline underline-offset-2 hover:decoration-solid',
          ...(isExternal
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {}),
        },
        children,
      );
    }
    default:
      return h('span', children);
  }
}

/**
 * Рекурсивно рендерит плоский поток инлайновых токенов в VNode, разворачивая
 * пары open/close (strong, em, ссылка и т.д.).
 */
function renderInlineTokens(
  tokens: Token[],
  cursor: TokenCursor,
  stopType: string | null,
): VNode[] {
  const nodes: VNode[] = [];

  while (cursor.index < tokens.length) {
    const token = tokens[cursor.index];

    if (!token) {
      break;
    }

    if (stopType !== null && token.type === stopType) {
      cursor.index++;

      break;
    }

    cursor.index++;

    if (token.nesting === 1) {
      const children = renderInlineTokens(
        tokens,
        cursor,
        closeTypeOf(token.type),
      );

      nodes.push(renderInlineContainer(token, children));

      continue;
    }

    nodes.push(...renderInlineLeaf(token));
  }

  return nodes;
}

/**
 * Рендерит содержимое inline-токена markdown-it (его children).
 */
function renderInlineChildren(token: Token): VNode[] {
  const children = token.children ?? [];

  return renderInlineTokens(children, { index: 0 }, null);
}

/**
 * Рендерит листовой (не контейнерный) блочный токен.
 */
function renderBlockLeaf(token: Token): VNode | null {
  switch (token.type) {
    case 'inline':
      return null; // содержимое обрабатывается отдельно (renderInlineChildren)
    case 'hr':
      return h('hr', { class: 'my-4 border-default' });
    case 'code_block':
    case 'fence':
      return h(
        'pre',
        { class: 'my-2 overflow-x-auto rounded bg-elevated p-3 text-sm' },
        [h('code', { class: 'font-mono' }, token.content)],
      );
    default:
      return null;
  }
}

/**
 * Оборачивает дочерние VNode в контейнерный блочный элемент (абзац, заголовок,
 * список, таблица, ячейка и т.д.).
 */
function renderBlockContainer(token: Token, children: VNode[]): VNode {
  switch (token.type) {
    case 'paragraph_open':
      return h('p', { class: 'mb-2' }, children);
    case 'heading_open':
      return h(token.tag, { class: headingClass(token.tag) }, children);
    case 'blockquote_open':
      return h(
        'blockquote',
        { class: 'my-2 border-l-4 border-default pl-4 text-muted italic' },
        children,
      );
    case 'bullet_list_open':
      return h('ul', { class: 'my-2 list-outside list-disc pl-6' }, children);
    case 'ordered_list_open': {
      const start = token.attrGet('start');

      return h(
        'ol',
        {
          class: 'my-2 list-outside list-decimal pl-6',
          ...(start ? { start: Number(start) } : {}),
        },
        children,
      );
    }
    case 'list_item_open':
      return h('li', { class: 'not-first:mt-1' }, children);
    case 'table_open':
      return h('div', { class: 'my-3 overflow-x-auto' }, [
        h('table', { class: 'w-full border-collapse text-sm' }, children),
      ]);
    case 'thead_open':
      return h('thead', children);
    case 'tbody_open':
      return h('tbody', children);
    case 'tr_open':
      return h('tr', children);
    case 'th_open':
      return h(
        'th',
        {
          class:
            'border border-default bg-elevated px-3 py-2 text-left font-semibold',
          style: token.attrGet('style'),
        },
        children,
      );
    case 'td_open':
      return h(
        'td',
        {
          class: 'border border-default px-3 py-2',
          style: token.attrGet('style'),
        },
        children,
      );
    default:
      return h('div', children);
  }
}

/**
 * Рекурсивно рендерит плоский поток блочных токенов в VNode, разворачивая пары
 * open/close (абзацы, списки, таблицы и т.д.).
 */
function renderBlockTokens(
  tokens: Token[],
  cursor: TokenCursor,
  stopType: string | null,
): VNode[] {
  const nodes: VNode[] = [];

  while (cursor.index < tokens.length) {
    const token = tokens[cursor.index];

    if (!token) {
      break;
    }

    if (stopType !== null && token.type === stopType) {
      cursor.index++;

      break;
    }

    cursor.index++;

    if (token.nesting === 1) {
      const children = renderBlockTokens(
        tokens,
        cursor,
        closeTypeOf(token.type),
      );

      nodes.push(renderBlockContainer(token, children));

      continue;
    }

    if (token.type === 'inline') {
      nodes.push(...renderInlineChildren(token));

      continue;
    }

    const leaf = renderBlockLeaf(token);

    if (leaf) {
      nodes.push(leaf);
    }
  }

  return nodes;
}

/**
 * Рендерит строку в формате «Markdown + маркеры {@...}» в массив VNode.
 *
 * Стандартный Markdown (жирный, курсив, заголовки, списки, таблицы, ссылки)
 * разбирается markdown-it, а кастомные маркеры {@...} делегируются
 * существующему парсеру/рендереру разметки. При ошибке возвращает исходный
 * текст, чтобы не терять контент.
 *
 * @param source - Исходная строка описания
 * @returns Массив VNode для рендера
 */
export function renderMarkdown(source: string): VNode[] {
  if (!source) {
    return [];
  }

  try {
    const tokens = markdownIt.parse(source, {});

    return renderBlockTokens(tokens, { index: 0 }, null);
  } catch (err) {
    logError('Markdown', 'Render error', { source, err });

    return [createTextVNode(source)];
  }
}

/**
 * Рендерит строку как ИНЛАЙНОВЫЙ Markdown (+ маркеры {@...}) в массив VNode —
 * без оборачивания в абзац/блоки.
 *
 * Нужен для содержимого маркеров {@...}: чтобы Markdown работал и ВНУТРИ тегов
 * (например `**жирный**` внутри `{@i ...}`). Верхний уровень уже покрыт
 * `renderMarkdown`, а этот рендер вызывается из строкового рендерера маркеров
 * для их текстовых узлов.
 *
 * @param text - Текстовый фрагмент (внутренность маркера)
 * @returns Массив VNode
 */
export function renderInlineMarkdown(text: string): VNode[] {
  if (!text) {
    return [];
  }

  try {
    const tokens = markdownIt.parseInline(text, {});

    return tokens.flatMap((token) => renderInlineChildren(token));
  } catch (err) {
    logError('Markdown', 'Inline render error', { text, err });

    return [createTextVNode(text)];
  }
}
