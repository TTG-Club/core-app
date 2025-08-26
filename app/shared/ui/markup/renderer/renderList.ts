import { h, type VNode } from 'vue';
import type { ListNode, RenderNode } from '../types';
import { isListNode } from '../utils';

type RenderListNodeDeps = {
  renderNode: (n: RenderNode) => VNode;
  toNodes: (i: RenderNode | string) => RenderNode[];
};

export function renderListNode(
  node: ListNode,
  deps: RenderListNodeDeps,
): VNode {
  const isOrdered = node.attrs?.type === 'ordered';
  const tag = isOrdered ? 'ol' : 'ul';

  const listClass =
    (isOrdered ? 'list-decimal' : 'list-disc') + ' list-outside pl-6';

  const liBatches: VNode[][] = [];

  for (const item of node.content ?? []) {
    if (Array.isArray(item)) {
      const batchNodes = item.flatMap((part) => deps.toNodes(part));
      const batch = batchNodes.map((n) => deps.renderNode(n));

      liBatches.push(batch);

      continue;
    }

    const nodes = deps.toNodes(item);

    if (nodes.length === 1) {
      const first = nodes[0];

      if (first && isListNode(first)) {
        const lastBatch = liBatches[liBatches.length - 1];

        if (lastBatch) {
          lastBatch.push(renderListNode(first, deps));
        } else {
          liBatches.push([renderListNode(first, deps)]);
        }

        continue;
      }
    }

    liBatches.push(nodes.map((n) => deps.renderNode(n)));
  }

  const children = liBatches.map((batch) => h('li', {}, batch));

  return h(tag, { class: listClass }, children);
}
