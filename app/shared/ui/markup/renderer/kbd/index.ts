import { h } from 'vue';
import MarkupKbd from './MarkupKbd.vue';
import type { KbdNode } from '../../types';

export function renderKbd(node: KbdNode, renderChildren: () => VNode[]): VNode {
  return h(
    MarkupKbd,
    { node },
    {
      default: () => renderChildren(),
    },
  );
}
