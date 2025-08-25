import {
  EmptyMarker,
  RichMarker,
  TextMarker,
  SectionMarker,
  SimpleText,
  ComplexEl,
} from '../types';

import type {
  EmptyNode,
  RenderNode,
  TextNode,
  SimpleTextNode,
  RichNode,
  SectionLinkNode,
  ListNode,
} from '../types';

export function isSimpleTextNode(node: RenderNode): node is SimpleTextNode {
  return Object.values(SimpleText).includes(node.type as SimpleText);
}

export function isEmptyNode(node: RenderNode): node is EmptyNode {
  return Object.values(EmptyMarker).includes(node.type as EmptyMarker);
}

export function isTextNode(node: RenderNode): node is TextNode {
  return Object.values(TextMarker).includes(node.type as TextMarker);
}

export function isRichNode(node: RenderNode): node is RichNode {
  return Object.values(RichMarker).includes(node.type as RichMarker);
}

export function isSectionNode(node: RenderNode): node is SectionLinkNode {
  return Object.values(SectionMarker).includes(node.type as SectionMarker);
}

export function isListNode(node: RenderNode): node is ListNode {
  return (node as any)?.type === ComplexEl.List;
}
