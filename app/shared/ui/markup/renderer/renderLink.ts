import type { LinkNode } from '../types';
import { NuxtLink } from '#components';

export function renderLinkNode(node: LinkNode, renderChildren: () => VNode[]) {
  const { url } = node.attrs;

  if (!url) {
    throw new Error('[Markup] Link node must have a `url`');
  }

  return h(NuxtLink, { to: url }, renderChildren);
}
