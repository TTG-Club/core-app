import { h, type VNode } from 'vue';
import type { ListNode, RenderChildren } from '../../types';
import MarkupList from './MarkupList.vue';

export function renderListNode(node: ListNode, deps: RenderChildren): VNode {
  return h(MarkupList, { node, deps });
}
