import type { VNode } from 'vue';

import type { MarkerNode } from '~ui/markup';

import { h } from 'vue';

import {
  getNodeText,
  isBlockNode,
  isMarkerNode,
  MARKER_ALIASES,
  MARKER_MAP,
  parse,
  render,
} from '~ui/markup';

/**
 * Является ли маркер {@...} блочным (заголовок, список, цитата, разделитель,
 * таблица). Нужно, чтобы NodeView отрисовал такой чип блоком, а не инлайном.
 *
 * Лёгкая проверка ПО ИМЕНИ маркера через конфиг (алиас → тип → флаг isBlock), без
 * полного рекурсивного парса — вызывается в токенайзере на каждый блок-кандидат.
 *
 * @param raw - Сырая строка маркера
 */
export function isBlockMarker(raw: string): boolean {
  if (!raw.startsWith('{@')) {
    return false;
  }

  let cursor = 2;

  while (cursor < raw.length && raw[cursor] !== ' ' && raw[cursor] !== '}') {
    cursor++;
  }

  const type = MARKER_ALIASES.get(raw.slice(2, cursor));

  return type ? MARKER_MAP.get(type)?.isBlock === true : false;
}

/**
 * Рендерит содержимое маркера как VNode-детей (поддерживает вложенные {@...},
 * например {@b ...} внутри {@i ...}). При ошибке — плоский текст-подпись.
 *
 * @param marker - Разобранный узел маркера
 * @returns Массив VNode либо строка-подпись
 */
function renderChildren(marker: MarkerNode): VNode[] | string {
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
 * Строит визуальный чип маркера {@...} из уже разобранного узла. Блочные маркеры
 * рисуем РЕАЛЬНЫМ компонентом (как на странице), остальные — упрощённым
 * предпросмотром по типу (форматирование — тегами, ссылки/интерактив — спанами).
 *
 * @param marker - Разобранный узел маркера
 * @param isBlock - Блочный ли маркер (вычислен в buildMarkerChip)
 * @returns VNode-представление чипа
 */
function renderChip(marker: MarkerNode, isBlock: boolean): VNode {
  const children = renderChildren(marker);

  if (isBlock) {
    try {
      const [vnode] = render([marker]);

      if (vnode) {
        return vnode;
      }
    } catch {
      // Падать нельзя — ниже отрисуем упрощённый вариант.
    }
  }

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

/**
 * Разбирает сырую строку маркера {@...} ОДИН раз и отдаёт готовый чип и флаг
 * блочности — чтобы NodeView (MarkerChip) не парсил raw дважды.
 *
 * @param raw - Сырая строка маркера, например `{@i текст}`
 * @returns Чип-VNode и признак блочного маркера
 */
export function buildMarkerChip(raw: string): {
  chip: VNode;
  isBlock: boolean;
} {
  const marker = parse(raw).find((node): node is MarkerNode =>
    isMarkerNode(node),
  );

  if (!marker) {
    return { chip: h('span', raw), isBlock: false };
  }

  const isBlock = isBlockNode(marker);

  return { chip: renderChip(marker, isBlock), isBlock };
}
