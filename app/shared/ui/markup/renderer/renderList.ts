import type { ListNode, RenderNode } from '../types';
import { isListNode } from '../utils';

export function renderListNode(
  node: ListNode,
  deps: {
    renderNode: (n: RenderNode) => VNode;
    toNodes: (i: RenderNode | string) => RenderNode[];
  },
): VNode {
  const isOrdered = node.attrs?.type === 'ordered';
  const tag = isOrdered ? 'ol' : 'ul';
  const listClass = isOrdered ? 'pl-6 list-decimal' : 'pl-6 list-disc';

  const liBatches: VNode[][] = [];

  (node.content ?? []).forEach((item) => {
    if (Array.isArray(item)) {
      const batch = (item as Array<RenderNode | string>)
        .flatMap(deps.toNodes)
        .map(deps.renderNode);

      liBatches.push(batch);

      return;
    }

    const nodes = deps.toNodes(item as RenderNode | string);

    if (nodes.length === 1) {
      const first = nodes[0];

      if (first && isListNode(first)) {
        if (liBatches.length > 0) {
          liBatches[liBatches.length - 1]!.push(renderListNode(first, deps));
        } else {
          liBatches.push([renderListNode(first, deps)]);
        }

        return;
      }
    }

    liBatches.push(nodes.map(deps.renderNode));
  });

  const children = liBatches.map((batch) => h('li', {}, batch));

  return h(tag, { class: listClass }, children);
}
