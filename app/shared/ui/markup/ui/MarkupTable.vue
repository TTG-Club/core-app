<script setup lang="ts">
  import {
    createColumnHelper,
    FlexRender,
    getCoreRowModel,
    useVueTable,
  } from '@tanstack/vue-table';

  import type { ColumnDef } from '@tanstack/vue-table';
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  interface TableCell {
    content: RenderNode[];
    align?: 'left' | 'center' | 'right';
  }

  interface TableRowData {
    cells: Array<string | number | RenderNode | TableCell>;
    index: number;
  }

  interface TableNode extends MarkerNode {
    caption?: string;
    colLabels?: string[];
    colStyles?: string[];
    rows?: any[][];
  }

  const { node, renderNodes } = defineProps<{
    node: TableNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const colCount = computed(() => {
    if (node.colLabels?.length) {
      return node.colLabels.length;
    }

    if (!node.rows || node.rows.length === 0) {
      return 0;
    }

    return Math.max(...node.rows.map((row) => row.length));
  });

  const labels = computed(() => {
    if (node.colLabels) {
      return node.colLabels;
    }

    return Array.from({ length: colCount.value }, (_, i) => `#${i + 1}`);
  });

  const tableData = computed<TableRowData[]>(() => {
    if (!node.rows || node.rows.length === 0) {
      return [];
    }

    return node.rows.map((cells, index) => ({ cells, index }));
  });

  function isRenderNode(value: unknown): value is RenderNode {
    return (
      typeof value === 'string' ||
      Array.isArray(value) ||
      (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'string')
    );
  }

  function isTableCell(value: unknown): value is TableCell {
    return (
      typeof value === 'object' &&
      value !== null &&
      'content' in value &&
      Array.isArray(value.content) &&
      !('type' in value)
    );
  }

  function normalizeCell(
    value: string | number | RenderNode | TableCell,
  ): TableCell {
    if (typeof value === 'string' || typeof value === 'number') {
      return { content: [String(value)] };
    }

    if (isTableCell(value)) {
      return value;
    }

    if (isRenderNode(value)) {
      return { content: [value] };
    }

    return { content: [] };
  }

  function renderCellContent(cell: TableCell): VNode[] {
    return renderNodes(cell.content ?? []);
  }

  const columnHelper = createColumnHelper<TableRowData>();

  const columns = computed<ColumnDef<TableRowData>[]>(() => {
    if (colCount.value === 0) {
      return [];
    }

    return Array.from({ length: colCount.value }, (_, columnIndex) =>
      columnHelper.display({
        id: `c${columnIndex}`,
        header: labels.value[columnIndex],
        cell: (ctx) => {
          const rawCell = ctx.row.original.cells[columnIndex];

          if (rawCell === undefined) {
            return undefined;
          }

          const cell = normalizeCell(rawCell);
          const content = renderCellContent(cell);

          if (cell.align) {
            return h('div', { class: `text-${cell.align}` }, content);
          }

          return content;
        },
      }),
    );
  });

  const table = useVueTable({
    get data() {
      return tableData.value;
    },
    get columns() {
      return columns.value;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  function getColStyle(index: number): string {
    return node.colStyles?.[index] ?? '';
  }
</script>

<template>
  <div class="w-full overflow-x-auto rounded-lg border border-default bg-muted">
    <table class="min-w-full border-collapse">
      <caption
        v-if="node.caption"
        class="py-2 text-sm font-medium text-highlighted"
      >
        {{
          node.caption
        }}
      </caption>

      <thead class="bg-elevated">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="(header, index) in headerGroup.headers"
            :key="header.id"
            :class="[
              'border-b border-default p-2 text-center text-xs text-highlighted',
              getColStyle(index),
            ]"
          >
            <FlexRender
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-default">
        <tr
          v-for="row in table.getRowModel().rows"
          :key="row.id"
          class="divide-x divide-default"
        >
          <td
            v-for="(cell, index) in row.getVisibleCells()"
            :key="cell.id"
            :class="['px-2 py-1 text-xs text-default', getColStyle(index)]"
          >
            <FlexRender
              :render="cell.column.columnDef.cell"
              :props="cell.getContext()"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
