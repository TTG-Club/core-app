import type { RenderNode } from './base';
import type { ComplexEl } from '../enums';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableCell {
  content: Array<string | RenderNode>;
  align?: TableAlign;
}

export interface TableNode {
  type: ComplexEl.Table;
  caption?: string;
  colLabels?: string[];
  colStyles?: string[];
  rows: Array<Array<string | number | RenderNode | TableCell>>;
}
