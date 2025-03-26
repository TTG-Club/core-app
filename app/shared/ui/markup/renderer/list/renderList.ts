export const ListNodeName = 'list' as const;

interface ListNode {
  type: typeof ListNodeName;
  attrs: {
    type: 'number' | 'bullet';
  };
}

export function renderLinkNode(node: ListNode, renderChildren: () => VNode[]) {
  const { type } = node.attrs;

  h(type === 'number' ? 'ol' : 'ul');
}
