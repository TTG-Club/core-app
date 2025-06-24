import { createTextVNode } from 'vue';

import {
  type TextNode,
  type MarkerNode,
  type RichNode,
  type EmptyNode,
  type RichNodes,
  type SectionLinkNode,
  type SectionNodes,
  TextMarker,
  EmptyMarker,
  RichMarker,
  SectionMarker,
} from '../types';
import {
  isEmptyNode,
  isFeatureNode,
  isRichNode,
  isSimpleTextNode,
  isTextNode,
} from '../utils';

import { renderLinkNode } from './renderLink';
import { renderSectionLinkNode } from './renderSectionLink';

const TextMarkerTag: Record<TextMarker, string> = {
  [TextMarker.Bold]: 'b',
  [TextMarker.Italic]: 'i',
  [TextMarker.Underline]: 'u',
  [TextMarker.Strikethrough]: 's',
  [TextMarker.Subscript]: 'sub',
  [TextMarker.Superscript]: 'sup',
  [TextMarker.Highlight]: 'mark',
};

const EmptyMarkerTag: Record<EmptyMarker, string> = {
  [EmptyMarker.Break]: 'br',
};

const RICH_NODE_RENDERERS: {
  [K in RichMarker]: (
    node: RichNodes[K],
    renderChildren: () => VNode[],
  ) => VNode;
} = {
  [RichMarker.Link]: renderLinkNode,
};

const FEATURE_NODE_RENDERERS: {
  [K in SectionMarker]: (
    node: SectionNodes[K],
    renderChildren: () => VNode[],
  ) => VNode;
} = {
  [SectionMarker.Spell]: renderSectionLinkNode,
  [SectionMarker.Background]: renderSectionLinkNode,
  [SectionMarker.Feat]: renderSectionLinkNode,
  [SectionMarker.Creature]: renderSectionLinkNode,
  [SectionMarker.MagicItem]: renderSectionLinkNode,
  [SectionMarker.Glossary]: renderSectionLinkNode,
};

// Функция для рендера контента — принимает массив узлов
export function render(content: MarkerNode[]) {
  return content.map((node) => renderNode(node));
}

function renderNode(node: MarkerNode): VNode {
  if (!node) {
    throw new Error('[Markup] Node is not defined');
  }

  if (isSimpleTextNode(node)) {
    return createTextVNode(node.text);
  }

  if (isTextNode(node)) {
    return renderTextNode(node);
  }

  if (isRichNode(node)) {
    return renderRichNode(node);
  }

  if (isFeatureNode(node)) {
    return renderFeatureLinkNode(node);
  }

  if (isEmptyNode(node)) {
    return renderEmptyNode(node);
  }

  throw new Error(`[Markup] Unknown node`);
}

function renderTextNode(node: TextNode): VNode {
  const tag = TextMarkerTag[node.type];

  if (!tag) {
    throw new Error(`[Markup] Unknown tag for text node`);
  }

  const child = node.content.map((item) => renderNode(item));

  if (!child?.length) {
    throw new Error(`[Markup] Text node must have content`);
  }

  return h(tag, child);
}

function renderEmptyNode(node: EmptyNode): VNode {
  const tag = EmptyMarkerTag[node.type];

  if (!tag) {
    throw new Error(`[Markup] Unknown tag for text node`);
  }

  return h(tag);
}

function renderRichNode(node: RichNode): VNode {
  const child = node.content?.map((item) => renderNode(item));

  if (!child.length) {
    throw new Error(`[Markup] Rich node must have content`);
  }

  const renderFn = RICH_NODE_RENDERERS[node.type];

  if (!renderFn) {
    throw new Error(`[Markup] Unknown tag for rich node: ${node.type}`);
  }

  return renderFn(node, () => child);
}

function renderFeatureLinkNode(node: SectionLinkNode): VNode {
  const child = node.content?.map((item) => renderNode(item));

  if (!child.length) {
    throw new Error(`[Markup] Drawer Link node must have content`);
  }

  const renderFn = FEATURE_NODE_RENDERERS[node.type];

  if (!renderFn) {
    throw new Error(`[Markup] Unknown tag for rich node: ${node.type}`);
  }

  return renderFn(node, () => child);
}
