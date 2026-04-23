import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import DiceRollView from '../views/DiceRollView.vue';

export const DiceRoll = Node.create({
  name: 'diceRoll',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      notation: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="dice-roll"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'dice-roll' }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(DiceRollView);
  },
});
