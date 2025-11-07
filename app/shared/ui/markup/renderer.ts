import { createTextVNode, h, type VNode } from 'vue';
import type { RenderNode } from './types';
import { MARKER_MAP } from './config';
import { parse } from './parser';
import { isBlockNode, isMarkerNode, isSimpleTextNode } from './utils';

// Валидация контента: блочные элементы не могут быть внутри inline
function validateContent(
  content: RenderNode[] | undefined,
  parentType: string,
  parentIsBlock: boolean,
): void {
  if (!content) return;

  for (const child of content) {
    // Пропускаем строки и SimpleTextNode
    if (typeof child === 'string' || isSimpleTextNode(child)) continue;

    // Проверяем массивы рекурсивно
    if (Array.isArray(child)) {
      validateContent(child, parentType, parentIsBlock);

      continue;
    }

    // Проверяем MarkerNode
    if (isMarkerNode(child)) {
      const isChildBlock = isBlockNode(child);

      // Блочный элемент внутри inline-элемента — ошибка
      if (!parentIsBlock && isChildBlock) {
        throw new Error(
          `[Markup] Block element "${child.type}" cannot be nested inside inline element "${parentType}"`,
        );
      }

      // Рекурсивно проверяем дочерние элементы
      if (child.content) {
        validateContent(child.content, child.type, isChildBlock);
      }
    }
  }
}

// Нормализация: всегда возвращает массив VNode
export function renderNodes(nodes: RenderNode[]): VNode[] {
  return nodes.flatMap((node) => {
    const result = renderNode(node);

    return Array.isArray(result) ? result : [result];
  });
}

// Основной рендер - может возвращать VNode или VNode[]
function renderNode(node: RenderNode): VNode | VNode[] {
  // Строка
  if (typeof node === 'string') {
    const parsed = parse(node);

    return renderNodes(parsed);
  }

  // Массив
  if (Array.isArray(node)) {
    return renderNodes(node);
  }

  // Простой текст
  if (isSimpleTextNode(node)) {
    return createTextVNode(node.text);
  }

  // Маркер
  if (isMarkerNode(node)) {
    const config = MARKER_MAP.get(node.type);

    if (!config) {
      throw new Error(`[Markup] Unknown node type: ${node.type}`);
    }

    // Валидация контента перед рендером
    const isBlock = config.isBlock === true;

    validateContent(node.content, node.type, isBlock);

    // Empty маркер
    if (config.isEmpty) {
      return h(config.tag!);
    }

    // HTML-тег
    if (config.tag) {
      const children = node.content ? renderNodes(node.content) : [];

      return h(config.tag, children);
    }

    // Vue-компонент
    if (config.component) {
      return h(config.component, { node, renderNodes });
    }

    throw new Error(`[Markup] No renderer for: ${node.type}`);
  }

  throw new Error('[Markup] Unknown node type');
}

export function render(content: RenderNode | RenderNode[]): VNode[] {
  if (Array.isArray(content)) {
    return renderNodes(content);
  }

  const result = renderNode(content);

  return Array.isArray(result) ? result : [result];
}
