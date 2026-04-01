import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import BadgeView from '../views/BadgeView.vue';

export const MarkupBadge = Node.create({
  name: 'markupBadge',
  group: 'inline',
  inline: true,
  content: 'inline*',

  addAttributes() {
    return {
      color: { default: 'warning' },
      variant: { default: 'soft' },
      size: { default: 'sm' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="markup-badge"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'markup-badge' }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(BadgeView);
  },
});
