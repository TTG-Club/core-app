import type { RenderNode } from './types';

import { z } from 'zod';

/**
 * Узел разметки в ответе API: строка (в т.ч. сырая JSON-строка), массив или
 * объект. Бэкенд присылает все три вида, а глубже узел разбирает уже
 * `MarkupRender`, поэтому проверка здесь только по форме верхнего уровня.
 *
 * @param value - Проверяемое значение
 * @returns true, если значение можно отдать рендереру разметки
 */
export function isRenderNode(value: unknown): value is RenderNode {
  return (
    typeof value === 'string'
    || Array.isArray(value)
    || (typeof value === 'object' && value !== null)
  );
}

/** Zod-схема узла разметки в ответе API — общая для всех разделов. */
export const renderNodeSchema = z.custom<RenderNode>(
  isRenderNode,
  'Ожидается разметка',
);
