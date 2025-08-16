import type { VNode } from 'vue';
import type { ListItemNode, ListNode } from '../types';

export function renderUnorderedList(
  node: ListNode,
  renderChildren: () => VNode[],
) {
  const children = renderChildren();

  return h('ul', {}, children);
}

export function renderOrderedList(
  node: ListNode,
  renderChildren: () => VNode[],
) {
  const children = renderChildren();

  return h('ol', {}, children);
}

export function renderListItem(
  node: ListItemNode,
  renderChildren: () => VNode[],
) {
  return h('li', {}, renderChildren());
}
