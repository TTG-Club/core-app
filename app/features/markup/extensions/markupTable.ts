import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import TableView from '../views/TableView.vue';

export const MarkupTable = Node.create({
  name: 'markupTable',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      caption: { default: [] },
      colLabels: { default: [] },
      colStyles: { default: [] },
      rows: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="markup-table"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'markup-table' }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(TableView);
  },
});
