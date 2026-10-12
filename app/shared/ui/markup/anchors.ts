import type {
  HeadingLevel,
  MarkerNode,
  RenderNode,
  SimpleTextNode,
} from './types';

import {
  HEADING_ANCHOR_ATTRIBUTE,
  HEADING_ANCHOR_FALLBACK_SLUG,
  HEADING_ANCHOR_PREFIX,
  HEADING_BLOCK_TYPE,
} from './consts';
import { parse } from './parser';
import { clampHeadingLevel, getNodeText, isMarkerNode } from './utils';

type FlatRenderNode = string | SimpleTextNode | MarkerNode;

/** Заголовок описания с якорем — пункт содержания. */
export interface MarkupHeadingAnchor {
  /** Id элемента заголовка на странице */
  id: string;
  /** Текст заголовка без разметки */
  text: string;
  /** Пользовательский уровень заголовка 1–4 */
  level: HeadingLevel;
}

/** Описание, в котором заголовки получили якоря, и список этих заголовков. */
export interface AnchoredMarkup {
  nodes: RenderNode | RenderNode[];
  headings: MarkupHeadingAnchor[];
}

/**
 * Разворачивает вложенные массивы-батчи на один уровень.
 *
 * @param nodes - Узлы, среди которых могут быть массивы
 * @returns Плоский массив узлов
 */
function flattenNodes(nodes: RenderNode[]): FlatRenderNode[] {
  return nodes.flatMap((node) => (Array.isArray(node) ? node : [node]));
}

/**
 * Читает id якоря, который withHeadingAnchors положил в атрибуты заголовка.
 *
 * @param node - Узел заголовка
 * @returns Id якоря или `undefined`, если заголовку якорь не нужен
 */
export function getHeadingAnchor(node: MarkerNode): string | undefined {
  const anchor = node.attrs?.[HEADING_ANCHOR_ATTRIBUTE];

  return typeof anchor === 'string' && anchor ? anchor : undefined;
}

/**
 * Даёт каждому заголовку `{@h}` описания уникальный id якоря и собирает их
 * в список для содержания (в порядке появления на странице).
 *
 * Исходное дерево не меняется — возвращается новое. Строки верхнего уровня
 * разбираются так же, как это делает рендер (`toBlockGroups`), поэтому якоря
 * получают и заголовки из сырой разметки.
 *
 * @param content - Описание: узел или массив записей
 * @returns Дерево с якорями и список заголовков
 */
export function withHeadingAnchors(
  content: RenderNode | RenderNode[],
): AnchoredMarkup {
  const headings: MarkupHeadingAnchor[] = [];
  const usedIds = new Set<string>();

  const createAnchorId = (text: string): string => {
    const baseId = `${HEADING_ANCHOR_PREFIX}${getSlug(text) || HEADING_ANCHOR_FALLBACK_SLUG}`;

    // Повторяющиеся заголовки различаем суффиксом: `id`, `id-2`, `id-3`. Занятость
    // проверяем по итоговому id, а не по слагу: заголовок «Пример 2» даёт тот же
    // id, что и второй «Пример».
    let id = baseId;

    for (let suffix = 2; usedIds.has(id); suffix += 1) {
      id = `${baseId}-${suffix}`;
    }

    usedIds.add(id);

    return id;
  };

  function anchorMarker(node: MarkerNode): MarkerNode {
    if (node.type === HEADING_BLOCK_TYPE) {
      const text = getNodeText(node.content ?? []).trim();

      if (!text) {
        return node;
      }

      const id = createAnchorId(text);

      headings.push({ id, text, level: clampHeadingLevel(node.attrs?.level) });

      return {
        ...node,
        attrs: { ...node.attrs, [HEADING_ANCHOR_ATTRIBUTE]: id },
      };
    }

    if (!node.content) {
      return node;
    }

    return { ...node, content: node.content.map(anchorChild) };
  }

  // Вложенные строки не разбираем: рендер рисует их как инлайн-текст.
  function anchorFlat(node: FlatRenderNode): FlatRenderNode {
    return isMarkerNode(node) ? anchorMarker(node) : node;
  }

  function anchorChild(node: RenderNode): RenderNode {
    return Array.isArray(node) ? node.map(anchorFlat) : anchorFlat(node);
  }

  const anchorEntry = (entry: RenderNode): RenderNode =>
    typeof entry === 'string'
      ? flattenNodes(parse(entry)).map(anchorFlat)
      : anchorChild(entry);

  const nodes = Array.isArray(content)
    ? content.map(anchorEntry)
    : anchorEntry(content);

  return { nodes, headings };
}
