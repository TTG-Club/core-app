import type {
  EmptyNode,
  MarkerNode,
  TextNode,
  SimpleTextNode,
  RichNode,
  TextWithMarkerName,
  SimpleTextName,
  EmptyMarkerName,
  TextMarkerName,
  RichMarkerName,
} from './types';

import { EmptyMarker, RichMarker, TextMarker, SimpleText } from './types';

export function isSimpleText(
  marker: TextWithMarkerName,
): marker is SimpleTextName {
  return Object.values(SimpleText).includes(marker as SimpleText);
}

export function isEmptyMarker(
  marker: TextWithMarkerName,
): marker is EmptyMarkerName {
  return Object.values(EmptyMarker).includes(marker as EmptyMarker);
}

export function isTextMarker(
  marker: TextWithMarkerName,
): marker is TextMarkerName {
  return Object.values(TextMarker).includes(marker as TextMarker);
}

export function isRichMarker(
  marker: TextWithMarkerName,
): marker is RichMarkerName {
  return Object.values(RichMarker).includes(marker as RichMarker);
}

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
