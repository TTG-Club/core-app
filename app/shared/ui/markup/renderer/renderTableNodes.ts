import { h, type VNode } from 'vue';
import type { TableNode, TableRow, TableCell, RenderNode } from '../types';
import UTableCompat from '../ui/UTableCompat';

type Deps = {
  renderNode: (n: RenderNode) => VNode;
  toNodes: (i: RenderNode | string) => RenderNode[];
};

type ColumnDef = {
  id: string;
  header: string | ((ctx: any) => VNode);
  cell?: (ctx: any) => VNode;
  meta?: { class?: { th?: string; td?: string } };
};

export function renderTableNode(node: TableNode, deps: Deps): VNode {
  const propsFromJson = (node.props ?? {}) as Record<string, unknown>;
  const rowsSrc = node.rows ?? [];

  const colCount = rowsSrc.reduce((m, r) => Math.max(m, r.cells.length), 0);

  const headerRow = rowsSrc.find(
    (r) => r.header || r.cells.every((c) => !!c.header),
  );

  const labels: string[] = Array.from({ length: colCount }).map((_, i) => {
    const cell = headerRow?.cells[i];

    let text = '';

    for (const chunk of cell?.content ?? []) {
      if (!Array.isArray(chunk) && typeof chunk === 'string') text += chunk;
    }

    return text.trim() || `#${i + 1}`;
  });

  const data = rowsSrc.map((r, ri) => ({ __row: r, __ri: ri }));

  const columns: ColumnDef[] = Array.from({ length: colCount }).map((_, ci) => {
    const header: string = labels[ci] ?? `#${ci + 1}`;

    return {
      id: `c${ci}`,
      header,
      cell: ({ row }: { row: { original?: { __row?: TableRow } } }) => {
        const srcRow = row?.original?.__row;

        if (!srcRow) return h('span');

        const cell: TableCell | undefined = srcRow.cells[ci];

        if (!cell) return h('span');

        const align = cell.align ?? srcRow.align ?? 'left';

        let alignClass = 'text-left';
        if (align === 'center') alignClass = 'text-center';
        else if (align === 'right') alignClass = 'text-right';

        const parts: VNode[] = [];

        for (const chunk of cell.content ?? []) {
          if (Array.isArray(chunk)) {
            for (const sub of chunk)
              for (const n of deps.toNodes(sub)) parts.push(deps.renderNode(n));
          } else {
            for (const n of deps.toNodes(chunk)) parts.push(deps.renderNode(n));
          }
        }

        return h('div', { class: ['align-top', alignClass].join(' ') }, parts);
      },
      meta: {
        class: {
          th: 'text-left',
          td: 'text-left',
        },
      },
    };
  });

  return h(UTableCompat, {
    ...propsFromJson,
    data,
    columns,
  });
}
