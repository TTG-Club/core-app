import type { ComplexEl } from '../enums';
import {
  TextMarker,
  RichMarker,
  EmptyMarker,
  SectionMarker,
  SimpleText,
} from '../enums';
import type { TableNode } from './table';
import type { VNode } from 'vue';

export type ListType = 'ordered' | 'unordered';

export const Marker = {
  ...TextMarker,
  ...RichMarker,
  ...EmptyMarker,
  ...SectionMarker,
} as const;

export const TextWithMarker = {
  ...SimpleText,
  ...Marker,
} as const;

export type SimpleTextName = (typeof TextWithMarker)[keyof typeof SimpleText];

export type TextMarkerName = (typeof TextWithMarker)[keyof typeof TextMarker];

export type RichMarkerName = (typeof TextWithMarker)[keyof typeof RichMarker];

export type SectionMarkerName =
  (typeof TextWithMarker)[keyof typeof SectionMarker];

export type EmptyMarkerName = (typeof TextWithMarker)[keyof typeof EmptyMarker];

export type MarkerName =
  | TextMarkerName
  | RichMarkerName
  | EmptyMarkerName
  | SectionMarkerName;

export type TextWithMarkerName =
  | SimpleTextName
  | TextMarkerName
  | RichMarkerName
  | EmptyMarkerName
  | SectionMarkerName;

export type ParamValue = string | number | boolean | null;

export type MarkerAttributes = Record<string, ParamValue>;

export type RenderNode =
  | SimpleTextNode
  | EmptyNode
  | TextNode
  | RichNode
  | SectionLinkNode
  | ListNode
  | TableNode;

export interface SimpleTextNode {
  type: SimpleText.Text;
  text: string;
}

export interface EmptyNode {
  type: EmptyMarker;
}

export interface TextNode {
  type: TextMarker;
  attrs?: MarkerAttributes;
  content: Array<RenderNode>;
}

export type RichNodes = {
  [RichMarker.Link]: LinkNode;
};

export type RichNode = RichNodes[RichMarker];

export interface LinkNode {
  type: RichMarker.Link;
  attrs: {
    url?: string;
    target?: string;
  };
  content: Array<RenderNode>;
}

export interface ListNode {
  type: ComplexEl.List;
  attrs: {
    type: ListType;
  };
  content: Array<RenderNode | string | Array<RenderNode | string>>;
}

export type SectionNodes = {
  [SectionMarker.Class]: SectionNode;
  [SectionMarker.Spell]: SectionNode;
  [SectionMarker.Background]: SectionNode;
  [SectionMarker.Feat]: SectionNode;
  [SectionMarker.MagicItem]: SectionNode;
  [SectionMarker.Item]: SectionNode;
  [SectionMarker.Creature]: SectionNode;
  [SectionMarker.Glossary]: SectionNode;
};

export type SectionLinkNode = SectionNodes[SectionMarker];

export interface SectionNode {
  type: SectionMarker;
  attrs: {
    url?: string;
  };
  content: Array<RenderNode>;
}

export type Entry = string | RenderNode;

export type EntryList = Array<Entry>;

export type RenderChildren = {
  renderNode: (n: RenderNode) => VNode;
  toNodes: (i: RenderNode | string) => RenderNode[];
};
