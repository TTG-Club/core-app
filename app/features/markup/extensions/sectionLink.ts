import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import SectionLinkView from '../views/SectionLinkView.vue';

export const SectionLink = Node.create({
  name: 'sectionLink',
  group: 'inline',
  inline: true,
  content: 'inline*',

  addAttributes() {
    return {
      sectionType: {
        default: 'spell',
      },
      url: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="section-link"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'section-link' }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(SectionLinkView);
  },
});
