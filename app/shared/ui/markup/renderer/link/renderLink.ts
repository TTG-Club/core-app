import { h, type VNode } from 'vue';
import type { LinkNode } from '../../types';
import MarkupLink from './MarkupLink.vue';

export function renderLink(node: LinkNode, renderChildren: () => VNode[]) {
  return h(
    MarkupLink,
    { node },
    {
      default: renderChildren,
    },
  );
}
