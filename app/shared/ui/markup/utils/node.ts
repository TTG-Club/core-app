import { EmptyMarker, RichMarker, TextMarker, SimpleText } from '../types';

import type {
  EmptyNode,
  MarkerNode,
  TextNode,
  SimpleTextNode,
  RichNode,
} from '../types';

export function isSimpleTextNode(node: MarkerNode): node is SimpleTextNode {
  return Object.values(SimpleText).includes(node.type as SimpleText);
}

export function isEmptyNode(node: MarkerNode): node is EmptyNode {
  return Object.values(EmptyMarker).includes(node.type as EmptyMarker);
}

export function isTextNode(node: MarkerNode): node is TextNode {
  return Object.values(TextMarker).includes(node.type as TextMarker);
}

export function isRichNode(node: MarkerNode): node is RichNode {
  return Object.values(RichMarker).includes(node.type as RichMarker);
}
