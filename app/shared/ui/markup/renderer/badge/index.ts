import { h } from 'vue';
import MarkupBadge from './MarkupBadge.vue';
import type { BadgeNode } from '../../types';

export function renderBadge(
  node: BadgeNode,
  renderChildren: () => VNode[],
): VNode {
  return h(
    MarkupBadge,
    { node },
    {
      default: () => renderChildren(),
    },
  );
}
