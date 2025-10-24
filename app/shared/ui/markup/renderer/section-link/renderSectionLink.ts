import { h, type VNode } from 'vue';
import type { SectionNode } from '../../types';
import MarkupSectionLink from './MarkupSectionLink.vue';

export function renderSectionLink(
  node: SectionNode,
  renderChildren: () => VNode[],
) {
  return h(
    MarkupSectionLink,
    { node },
    {
      default: renderChildren,
    },
  );
}
