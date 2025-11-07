import type { MarkerType } from './config';
import type { VNode } from 'vue';

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

export interface Group {
  id: number;
  isBlock: boolean;
  vnodes: VNode[];
}

export interface RenderResult {
  isSingle: boolean;
  vnodes?: VNode[];
  groups?: Group[];
}
