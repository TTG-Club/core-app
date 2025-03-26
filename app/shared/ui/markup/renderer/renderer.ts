import {
  type TextNode,
  type MarkerNode,
  type RichNode,
  type RichNodes,
  TextMarker,
  RichMarker,
} from '../types';
import { isRichNode, isSimpleTextNode, isTextNode } from '../utils';
import { parse } from '../parser';
import { renderLinkNode } from './link/renderLink';
import { createTextVNode } from 'vue';
import { isString } from 'lodash-es';

const TextMarkerTag: Record<TextMarker, string> = {
  [TextMarker.Bold]: 'b',
  [TextMarker.Italic]: 'i',
  [TextMarker.Underline]: 'u',
  [TextMarker.Strikethrough]: 's',
  [TextMarker.Subscript]: 'sub',
  [TextMarker.Superscript]: 'sup',
  [TextMarker.Highlight]: 'mark',
};

const RICH_NODE_RENDERERS: {
  [K in RichMarker]: (
    node: RichNodes[K],
    renderChildren: () => VNode[],
  ) => VNode;
} = {
  [RichMarker.Link]: renderLinkNode,
};

// Функция для рендера контента — принимает массив узлов
export function render(entries: Array<string | MarkerNode>) {
  return entries.map((entry) => {
    if (isString(entry)) {
      return h('p', parse(entry).map(renderNode));
    }

    return renderNode(entry);
  });
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

  throw new Error(`[Markup] Unknown node`);
}

function renderTextNode(node: TextNode): VNode {
  const tag = TextMarkerTag[node.type];

  if (!tag) {
    throw new Error(`[Markup] Unknown tag for text node`);
  }

  const child = node.content.map((child) => renderNode(child));

  if (!child?.length) {
    throw new Error(`[Markup] Text node must have content`);
  }

  return h(tag, child);
}

function renderRichNode(node: RichNode): VNode {
  const child = node.content?.map((child) => renderNode(child));

  if (!child.length) {
    throw new Error(`[Markup] Rich node must have content`);
  }

  const renderFn = RICH_NODE_RENDERERS[node.type];

  if (!renderFn) {
    throw new Error(`[Markup] Unknown tag for rich node: ${node.type}`);
  }

  return renderFn(node, () => child);
}
