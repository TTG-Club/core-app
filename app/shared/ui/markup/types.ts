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
}

export enum EmptyMarker {
  Break = 'break',
}

export enum FeatureMarker {
  Spell = 'spell',
  Feat = 'feat',
  Background = 'background',
  MagicItem = 'magic-item',
  Bestiary = 'bestiary',
  Glossary = 'glossary',
}

export const Marker = {
  ...TextMarker,
  ...RichMarker,
  ...EmptyMarker,
  ...FeatureMarker,
} as const;

export const TextWithMarker = {
  ...SimpleText,
  ...Marker,
} as const;

export type SimpleTextName = (typeof TextWithMarker)[keyof typeof SimpleText];

export type TextMarkerName = (typeof TextWithMarker)[keyof typeof TextMarker];

export type RichMarkerName = (typeof TextWithMarker)[keyof typeof RichMarker];

export type FeatureMarkerName =
  (typeof TextWithMarker)[keyof typeof FeatureMarker];

export type EmptyMarkerName = (typeof TextWithMarker)[keyof typeof EmptyMarker];

export type MarkerName =
  | TextMarkerName
  | RichMarkerName
  | EmptyMarkerName
  | FeatureMarkerName;

export type TextWithMarkerName =
  | SimpleTextName
  | TextMarkerName
  | RichMarkerName
  | EmptyMarkerName
  | FeatureMarkerName;

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
  | DrawerNode;

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
};

export type RichNode = RichNodes[RichMarker];

export interface LinkNode {
  type: RichMarker.Link;
  attrs: {
    url?: string;
  };
  content: Array<MarkerNode>;
}

export type FeatureNodes = {
  [FeatureMarker.Spell]: FeatureNode;
  [FeatureMarker.Background]: FeatureNode;
  [FeatureMarker.Feat]: FeatureNode;
  [FeatureMarker.MagicItem]: FeatureNode;
  [FeatureMarker.Bestiary]: FeatureNode;
  [FeatureMarker.Glossary]: FeatureNode;
};

export type DrawerNode = FeatureNodes[FeatureMarker];

export interface FeatureNode {
  type: FeatureMarker;
  attrs: {
    url?: string;
  };
  content: Array<MarkerNode>;
}
