import { createTextVNode } from 'vue';

import { TextMarker, EmptyMarker, RichMarker, SectionMarker } from '../types';
import type {
  TextNode,
  RenderNode,
  RichNode,
  EmptyNode,
  RichNodes,
  SectionLinkNode,
  SectionNodes,
  ListNode,
} from '../types';
import {
  isEmptyNode,
  isSectionNode,
  isRichNode,
  isSimpleTextNode,
  isTextNode,
  isListNode,
} from '../utils';

import { renderLink } from './renderLink';
import { renderSectionLink } from './renderSectionLink';
import { parse } from '../parser';

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
  [RichMarker.Link]: renderLink,
};

const FEATURE_NODE_RENDERERS: {
  [K in SectionMarker]: (
    node: SectionNodes[K],
    renderChildren: () => VNode[],
  ) => VNode;
} = {
  [SectionMarker.Spell]: renderSectionLink,
  [SectionMarker.Background]: renderSectionLink,
  [SectionMarker.Feat]: renderSectionLink,
  [SectionMarker.Creature]: renderSectionLink,
  [SectionMarker.MagicItem]: renderSectionLink,
  [SectionMarker.Glossary]: renderSectionLink,
};

function toNodes(input: RenderNode | string): RenderNode[] {
  if (typeof input === 'string') {
    return parse(input);
  }

  return [input];
}

// Функция для рендера контента — принимает массив узлов
export function render(content: Array<RenderNode | string>) {
  const nodes: RenderNode[] = content.flatMap(toNodes);

  return nodes.map((node) => renderNode(node));
}

function renderNode(node: RenderNode): VNode {
  if (!node) throw new Error('[Markup] Node is not defined');

  if (isSimpleTextNode(node)) return createTextVNode(node.text);
  if (isTextNode(node)) return renderTextNode(node);
  if (isRichNode(node)) return renderRichNode(node);
  if (isSectionNode(node)) return renderSectionLinkNode(node);
  if (isEmptyNode(node)) return renderEmptyNode(node);
  if (isListNode(node)) return renderListNode(node);

  throw new Error('[Markup] Unknown node');
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

function renderSectionLinkNode(node: SectionLinkNode): VNode {
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

function renderListNode(node: ListNode): VNode {
  const isOrdered = node.attrs?.type === 'ordered';
  const tag = isOrdered ? 'ol' : 'ul';
  const listClass = isOrdered ? 'pl-6 list-decimal' : 'pl-6 list-disc';

  const liBatches: VNode[][] = [];

  (node.content ?? []).forEach((item) => {
    if (Array.isArray(item)) {
      const batch = (item as Array<RenderNode | string>)
        .flatMap(toNodes)
        .map(renderNode);

      liBatches.push(batch);

      return;
    }

    const nodes = toNodes(item as RenderNode | string);

    if (nodes.length === 1) {
      const first = nodes[0];

      if (first && isListNode(first)) {
        if (liBatches.length > 0) {
          liBatches[liBatches.length - 1]!.push(renderListNode(first));
        } else {
          liBatches.push([renderListNode(first)]);
        }

        return;
      }
    }

    liBatches.push(nodes.map(renderNode));
  });

  const children = liBatches.map((batch) => h('li', {}, batch));

  return h(tag, { class: listClass }, children);
}
