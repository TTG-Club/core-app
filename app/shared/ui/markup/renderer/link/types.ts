import type { SimpleTextNode, RichMarker, TextNode } from '../../types';

export interface LinkNode {
  type: RichMarker.Link;
  attrs: {
    url?: string;
  };
  content: Array<SimpleTextNode | TextNode>;
}
