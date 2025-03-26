import type { MarkerNode, TextNode, SimpleTextNode, RichNode } from '../types';

import { RichMarker, TextMarker, SimpleText } from '../types';

export function isSimpleTextNode(node: MarkerNode): node is SimpleTextNode {
  return Object.values(SimpleText).includes(node.type as SimpleText);
}

export function isTextNode(node: MarkerNode): node is TextNode {
  return Object.values(TextMarker).includes(node.type as TextMarker);
}

export function isRichNode(node: MarkerNode): node is RichNode {
  return Object.values(RichMarker).includes(node.type as RichMarker);
}
