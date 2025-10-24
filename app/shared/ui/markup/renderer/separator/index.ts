import { h } from 'vue';
import MarkupSeparator from './MarkupSeparator.vue';
import type { SeparatorNode } from '../../types';

export function renderSeparator(
  node: SeparatorNode,
  renderChildren: () => VNode[],
): VNode {
  return h(
    MarkupSeparator,
    { node },
    {
      default: () => renderChildren(),
    },
  );
}
