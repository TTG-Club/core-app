import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import KbdView from '../views/KbdView.vue';

export const MarkupKbd = Node.create({
  name: 'markupKbd',
  group: 'inline',
  inline: true,
  content: 'inline*',

  addAttributes() {
    return {
      color: { default: 'neutral' },
      variant: { default: 'soft' },
      size: { default: 'md' },
    };
  },

  parseHTML() {
    return [{ tag: 'kbd[data-type="markup-kbd"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'kbd',
      mergeAttributes(HTMLAttributes, { 'data-type': 'markup-kbd' }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(KbdView);
  },
});
