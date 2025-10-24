import { h } from 'vue';
import MarkupHeading from './MarkupHeading.vue';
import type { HeadingNode } from '../../types';

export function renderHeading(
  node: HeadingNode,
  renderChildren: () => VNode[],
): VNode {
  return h(
    MarkupHeading,
    { node },
    {
      default: () => renderChildren(),
    },
  );
}
