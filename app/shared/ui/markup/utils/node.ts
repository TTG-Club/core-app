import type {
  EmptyNode,
  ListNode,
  RenderNode,
  RichNode,
  SectionLinkNode,
  SimpleTextNode,
  TextNode,
  TableNode,
} from '../types';
import {
  ComplexEl,
  EmptyMarker,
  RichMarker,
  SectionMarker,
  SimpleText,
  TextMarker,
} from '../enums';

export function isSimpleTextNode(node: RenderNode): node is SimpleTextNode {
  return node.type === SimpleText.Text;
}

export function isEmptyNode(node: RenderNode): node is EmptyNode {
  return node.type === EmptyMarker.Break;
}

export function isTextNode(node: RenderNode): node is TextNode {
  return (
    node.type === TextMarker.Bold ||
    node.type === TextMarker.Italic ||
    node.type === TextMarker.Underline ||
    node.type === TextMarker.Strikethrough ||
    node.type === TextMarker.Superscript ||
    node.type === TextMarker.Subscript ||
    node.type === TextMarker.Highlight
  );
}

export function isRichNode(node: RenderNode): node is RichNode {
  return node.type === RichMarker.Link;
}

export function isSectionNode(node: RenderNode): node is SectionLinkNode {
  return (
    node.type === SectionMarker.Class ||
    node.type === SectionMarker.Spell ||
    node.type === SectionMarker.Feat ||
    node.type === SectionMarker.Background ||
    node.type === SectionMarker.MagicItem ||
    node.type === SectionMarker.Creature ||
    node.type === SectionMarker.Item ||
    node.type === SectionMarker.Glossary
  );
}

export function isListNode(node: RenderNode): node is ListNode {
  return node.type === ComplexEl.List;
}

export function isTableNode(node: RenderNode): node is TableNode {
  return node.type === ComplexEl.Table;
}
