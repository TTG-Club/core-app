import { consola } from 'consola';

import { MARKER_MAP } from './config';

import type { MarkerNode, RenderNode, SimpleTextNode } from './types';

/**
 * Логирует ошибку с контекстом разметки.
 *
 * @param context - Контекст возникновения ошибки (например, имя компонента)
 * @param message - Сообщение об ошибке
 * @param data - Дополнительные данные для отладки
 */
export function logError(
  context: string,
  message: string,
  data?: unknown,
): void {
  consola.error(`[Markup ${context}]`, message, data);
}

/**
 * Проверяет, является ли узел простым текстовым узлом.
 *
 * @param node - Узел для проверки
 * @returns true, если узел является SimpleTextNode
 */
export function isSimpleTextNode(node: unknown): node is SimpleTextNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    !Array.isArray(node) &&
    'type' in node &&
    node.type === 'text'
  );
}

/**
 * Проверяет, является ли узел узлом разметки (маркером).
 *
 * @param node - Узел для проверки
 * @returns true, если узел является MarkerNode
 */
export function isMarkerNode(node: unknown): node is MarkerNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    !Array.isArray(node) &&
    'type' in node &&
    typeof node.type === 'string' &&
    node.type !== 'text'
  );
}

/**
 * Проверяет, является ли узел блочным элементом.
 *
 * @param node - Узел для проверки
 * @returns true, если узел является блочным элементом
 */
export function isBlockNode(node: unknown): boolean {
  if (!isMarkerNode(node)) {
    return false;
  }

  const config = MARKER_MAP.get(node.type);

  return config?.isBlock === true;
}

/**
 * Нормализует узлы рендеринга в массив.
 * Если передан один узел, возвращает массив с этим узлом.
 *
 * @param value - Узел или массив узлов
 * @returns Массив узлов RenderNode
 */
export function normalizeRenderNodes(
  value: RenderNode | RenderNode[],
): RenderNode[] {
  return Array.isArray(value) ? value : [value];
}
