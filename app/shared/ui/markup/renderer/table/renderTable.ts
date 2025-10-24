import { h, type VNode } from 'vue';
import type { TableNode, RenderChildren } from '../../types';
import MarkupTable from './MarkupTable.vue';

export function renderTableNode(node: TableNode, deps: RenderChildren): VNode {
  return h(MarkupTable, { node, deps });
}
