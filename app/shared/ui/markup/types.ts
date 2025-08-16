// Разрешенные маркеры и их алиасы.
export enum SimpleText {
  Text = 'text',
}

export enum TextMarker {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Superscript = 'superscript',
  Subscript = 'subscript',
  Highlight = 'highlight',
}

export enum RichMarker {
  Link = 'link',
  UnorderedList = 'ul',
  OrderedList = 'ol',
  ListItem = 'li',
}

export enum EmptyMarker {
  Break = 'break',
}

export enum SectionMarker {
  Spell = 'spell',
  Feat = 'feat',
  Background = 'background',
  MagicItem = 'magicItem',
  Creature = 'creature',
  Glossary = 'glossary',
}

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

// Типы данных для параметров атрибутов.
export type ParamValue = string | number | boolean | null;

// Тип для параметров маркера.
export type MarkerAttributes = Record<string, ParamValue>;

// Типы узлов TipTap.
export type MarkerNode =
  | SimpleTextNode
  | EmptyNode
  | TextNode
  | RichNode
  | SectionLinkNode;

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
  content: Array<MarkerNode>;
}

export type RichNodes = {
  [RichMarker.Link]: LinkNode;
  [RichMarker.UnorderedList]: ListNode;
  [RichMarker.OrderedList]: ListNode;
  [RichMarker.ListItem]: ListItemNode;
};

export type RichNode = RichNodes[RichMarker];

export interface LinkNode {
  type: RichMarker.Link;
  attrs: {
    url?: string;
  };
  content: Array<MarkerNode>;
}

export interface ListNode {
  type: RichMarker.UnorderedList | RichMarker.OrderedList;
  content: Array<MarkerNode>;
}

export interface ListItemNode {
  type: RichMarker.ListItem;
  content: Array<MarkerNode>;
}

export type SectionNodes = {
  [SectionMarker.Spell]: SectionNode;
  [SectionMarker.Background]: SectionNode;
  [SectionMarker.Feat]: SectionNode;
  [SectionMarker.MagicItem]: SectionNode;
  [SectionMarker.Creature]: SectionNode;
  [SectionMarker.Glossary]: SectionNode;
};

export type SectionLinkNode = SectionNodes[SectionMarker];

export interface SectionNode {
  type: SectionMarker;
  attrs: {
    url?: string;
  };
  content: Array<MarkerNode>;
}
