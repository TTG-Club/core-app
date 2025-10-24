import { h } from 'vue';
import MarkupQuote from './MarkupQuote.vue';
import type { QuoteNode } from '../../types';

export function renderQuote(
  node: QuoteNode,
  renderChildren: () => VNode[],
): VNode {
  return h(
    MarkupQuote,
    { node },
    {
      default: () => renderChildren(),
    },
  );
}
