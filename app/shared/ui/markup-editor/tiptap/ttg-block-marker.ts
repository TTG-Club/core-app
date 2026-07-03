import { Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import MarkerChip from './MarkerChip.vue';
import { blockMarkerMarkdownTokenizer } from './marks';

/**
 * Атомарный БЛОЧНЫЙ узел для блочных маркеров {@...} (заголовок, список, цитата,
 * разделитель, таблица). В отличие от инлайнового `TtgMarker`, стоит МЕЖДУ
 * абзацами, поэтому продолжение набора уходит в отдельный абзац, а сам маркер
 * сериализуется своим блоком (документ-хендлер разделяет блоки пустой строкой).
 *
 * Рисуется тем же чипом `MarkerChip` (он сам определяет блочность по raw).
 * В Markdown сериализуется дословно из атрибута `raw` — round-trip без потерь.
 */
export const TtgBlockMarker = Node.create({
  name: 'ttgBlockMarker',
  group: 'block',
  atom: true,
  selectable: true,

  markdownTokenName: 'ttgBlockMarker',
  markdownTokenizer: blockMarkerMarkdownTokenizer,
  parseMarkdown: (token) => ({
    type: 'ttgBlockMarker',
    attrs: { raw: String(token.raw ?? '').trim() },
  }),
  renderMarkdown: (node) => String(node.attrs?.raw ?? ''),

  addAttributes() {
    return {
      raw: {
        default: '',
        parseHTML: (element) => element.textContent ?? '',
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-ttg-block-marker]' }];
  },

  renderHTML({ node }) {
    return [
      'div',
      { 'data-ttg-block-marker': '' },
      String(node.attrs.raw ?? ''),
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(MarkerChip);
  },
});
