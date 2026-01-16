import { consola } from 'consola';

import { MARKER_MAP } from './config';

import type { MarkerNode, SimpleTextNode } from './types';

export function logError(
  context: string,
  message: string,
  data?: unknown,
): void {
  consola.error(`[Markup ${context}]`, message, data);
}

export function isSimpleTextNode(node: unknown): node is SimpleTextNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    !Array.isArray(node) &&
    'type' in node &&
    node.type === 'text'
  );
}

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

// Проверка, является ли нода блочным элементом
export function isBlockNode(node: unknown): boolean {
  if (!isMarkerNode(node)) {
    return false;
  }

  const config = MARKER_MAP.get(node.type);

  return config?.isBlock === true;
}
