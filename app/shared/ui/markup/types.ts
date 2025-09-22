// Разрешенные маркеры и их алиасы.
export enum SimpleText {
  Text = 'text',
}

export enum ComplexEl {
  List = 'list',
  Table = 'table',
}

export type TableAlign = 'left' | 'center' | 'right';

export interface TableCell {
  // контент ячейки: строка (с @-маркерами) или узлы; допускаем "батчи" для одного td/th
  content: Array<RenderNode | string | Array<RenderNode | string>>;
  header?: boolean; // если true — <th>, иначе <td>
  align?: TableAlign; // приоритетнее, чем выравнивание строки/таблицы
  colSpan?: number;
  rowSpan?: number;
}

// Строка
export interface TableRow {
  cells: TableCell[];
  header?: boolean; // вся строка — заголовок (<thead>), можно не использовать, если задаёшь header на ячейках
  align?: TableAlign; // дефолтное выравнивание для ячеек строки
}

// Таблица
export interface TableNode {
  type: ComplexEl.Table;
  attrs?: {
    colAlign?: TableAlign[]; // выравнивание по колонкам (по индексу)
    dense?: boolean; // компактные отступы
    bordered?: boolean; // границы
    striped?: boolean; // зебра
    fullWidth?: boolean; // на всю ширину
  };
  rows: TableRow[];
}

export type ListType = 'ordered' | 'unordered';

export enum TextMarker {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Superscript = 'superscript',
  Subscript = 'subscript',
  Highlight = 'highlight',
  Blockquote = 'blockquote',
}

export enum RichMarker {
  Link = 'link',
}

export enum EmptyMarker {
  Break = 'break',
}

export enum SectionMarker {
  Class = 'class',
  Spell = 'spell',
  Feat = 'feat',
  Background = 'background',
  MagicItem = 'magicItem',
  Item = 'item',
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
