import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import QuoteView from '../views/QuoteView.vue';

export const MarkupQuote = Node.create({
  name: 'markupQuote',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      color: { default: 'warning' },
      variant: { default: 'soft' },
    };
  },

  parseHTML() {
    return [{ tag: 'blockquote[data-type="markup-quote"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      mergeAttributes(HTMLAttributes, { 'data-type': 'markup-quote' }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(QuoteView);
  },
});
