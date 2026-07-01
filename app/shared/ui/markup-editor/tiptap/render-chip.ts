import type { VNode } from 'vue';

import { h } from 'vue';

import { getNodeText, isMarkerNode, parse, render } from '~ui/markup';

/**
 * Рендерит содержимое маркера как VNode-детей (поддерживает Markdown и вложенные
 * {@...}: например `**жирный**` внутри `{@i ...}`). При ошибке — плоский текст.
 *
 * @param marker - Разобранный узел маркера
 * @returns Массив VNode либо строка-подпись
 */
function renderChildren(
  marker: ReturnType<typeof parse>[number],
): VNode[] | string {
  if (!isMarkerNode(marker)) {
    return '';
  }

  const content = marker.content ?? [];
  const fallback = getNodeText(content) || marker.type;

  if (!content.length) {
    return fallback;
  }

  try {
    return render(content);
  } catch {
    return fallback;
  }
}

/**
 * Строит визуальное представление маркера {@...} для показа внутри редактора
 * (чип). Это упрощённый предпросмотр по типу маркера: форматирование —
 * реальными тегами, интерактив/ссылки — стилизованными спанами. Полная точность
 * (дроверы, бросок кубика) не нужна — в редакторе важен именно вид.
 *
 * @param raw - Сырая строка маркера, например `{@i текст}`
 * @returns VNode-представление чипа
 */
export function renderMarkerChip(raw: string): VNode {
  const nodes = parse(raw);
  const marker = nodes.find((node) => isMarkerNode(node));

  if (!marker || !isMarkerNode(marker)) {
    return h('span', raw);
  }

  const children = renderChildren(marker);

  switch (marker.type) {
    case 'bold':
      return h('strong', { class: 'font-semibold' }, children);
    case 'italic':
      return h('em', children);
    case 'underline':
      return h('u', children);
    case 'strikethrough':
      return h('s', children);
    case 'superscript':
      return h('sup', children);
    case 'subscript':
      return h('sub', children);
    case 'highlight':
      return h('mark', { class: 'rounded bg-warning/30 px-0.5' }, children);
    case 'kbd':
      return h(
        'kbd',
        {
          class:
            'rounded border border-default bg-elevated px-1 py-0.5 font-mono text-xs',
        },
        children,
      );
    case 'badge':
      return h(
        'span',
        {
          class:
            'rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary',
        },
        children,
      );
    case 'roll':
      return h(
        'span',
        {
          class: 'text-link underline decoration-dotted underline-offset-2',
        },
        children,
      );
    case 'break':
      return h('br');
    // Ссылки на разделы и обычные ссылки — стилизованный спан-ссылка.
    case 'link':
    case 'class':
    case 'spell':
    case 'feat':
    case 'background':
    case 'magicItem':
    case 'creature':
    case 'item':
    case 'glossary':
      return h(
        'span',
        { class: 'text-link underline underline-offset-2' },
        children,
      );
    default:
      return h('span', children);
  }
}
