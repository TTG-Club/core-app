// Разрешенные маркеры и их алиасы.
import type { LinkNode } from './renderer';

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
}

export const Marker = {
  ...TextMarker,
  ...RichMarker,
} as const;

export const TextWithMarker = {
  ...SimpleText,
  ...Marker,
} as const;

export type SimpleTextName = (typeof TextWithMarker)[keyof typeof SimpleText];

export type TextMarkerName = (typeof TextWithMarker)[keyof typeof TextMarker];

export type RichMarkerName = (typeof TextWithMarker)[keyof typeof RichMarker];

export type MarkerName = TextMarkerName | RichMarkerName;

export type TextWithMarkerName =
  | SimpleTextName
  | TextMarkerName
  | RichMarkerName;

// Типы данных для параметров атрибутов.
export type ParamValue = string | number | boolean | null;

// Тип для параметров маркера.
export type MarkerAttributes = Record<string, ParamValue>;

// Типы узлов TipTap.
export type MarkerNode = SimpleTextNode | TextNode | RichNode;

export interface SimpleTextNode {
  type: SimpleText.Text;
  text: string;
}

export interface TextNode {
  type: TextMarker;
  attrs?: MarkerAttributes;
  content: Array<MarkerNode>;
}

export type RichNodes = {
  [RichMarker.Link]: LinkNode;
};

export type RichNode = RichNodes[RichMarker];
