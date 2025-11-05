import type { MarkerType } from './config';

export type MarkerAttributes = Record<string, string | number | boolean | null>;

// Простой текст
export interface SimpleTextNode {
  type: 'text';
  text: string;
}

// Маркер (включая list, table и всё остальное)
export interface MarkerNode {
  type: MarkerType;
  attrs?: MarkerAttributes;
  content?: RenderNode[];
}

// Union всех нод
export type RenderNode =
  | string
  | SimpleTextNode
  | MarkerNode
  | Array<string | SimpleTextNode | MarkerNode>;
