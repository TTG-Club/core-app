<script setup lang="ts">
  import type { ColumnDef } from '@tanstack/vue-table';
  import type { JSONContent } from '@tiptap/core';

  import {
    createColumnHelper,
    FlexRender,
    getCoreRowModel,
    useVueTable,
  } from '@tanstack/vue-table';
  import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';
  import {
    computed,
    defineComponent,
    h,
    onMounted,
    onUnmounted,
    provide,
    ref,
  } from 'vue';

  import { useDiceRollerState } from '~dice-roller/composables';

  import MarkupContent from '../content/MarkupContent.vue';
  import { getTextFromJSON } from '../model/utils';

  // eslint-disable-next-line vue/define-props-declaration
  const props = defineProps(nodeViewProps);

  const attrs = computed(() => props.node.attrs);
  const caption = computed<JSONContent[]>(() => attrs.value.caption || []);

  const rawColLabels = computed<JSONContent[][]>(
    () => attrs.value.colLabels || [],
  );

  const colStyles = computed<string[]>(() => attrs.value.colStyles || []);
  const rows = computed<JSONContent[][][]>(() => attrs.value.rows || []);

  const colCount = computed(() => {
    if (rawColLabels.value.length) {
      return rawColLabels.value.length;
    }

    if (rows.value.length === 0) {
      return 0;
    }

    return Math.max(...rows.value.map((row) => row.length));
  });

  const labels = computed<JSONContent[][]>(() => {
    if (rawColLabels.value.length) {
      return rawColLabels.value;
    }

    return Array.from({ length: colCount.value }, (_, i) => [
      { type: 'text', text: `#${i + 1}` },
    ]);
  });

  interface TableRowData {
    cells: JSONContent[][];
    index: number;
  }

  const tableData = computed<TableRowData[]>(() => {
    return rows.value.map((cells, index) => ({ cells, index }));
  });

  const activeRowIndex = ref<number | null>(null);

  function parseCellNumber(val: string): number {
    const trimmed = val.trim();

    if (trimmed === '00') {
      return 100;
    }

    return Number.parseInt(trimmed, 10);
  }

  function checkValueMatch(text: string, rollValue: number): boolean {
    const cleanText = text.trim();
    const rangeMatch = cleanText.match(/^(\d+)\s*[-–—]\s*(\d+)$/);

    if (rangeMatch) {
      const min = parseCellNumber(rangeMatch[1] || '');
      const max = parseCellNumber(rangeMatch[2] || '');

      return rollValue >= min && rollValue <= max;
    }

    const singleMatch = cleanText.match(/^(\d+)$/);

    if (singleMatch) {
      return rollValue === parseCellNumber(singleMatch[1] || '');
    }

    return false;
  }

  function handleTableRoll(value: number) {
    if (!Number.isFinite(value)) {
      activeRowIndex.value = null;

      return;
    }

    const numericValue = Math.round(value);

    const matchIndex = tableData.value.findIndex((row) => {
      const firstCell = row.cells[0];

      if (!firstCell) {
        return false;
      }

      const text = getTextFromJSON(firstCell);

      return checkValueMatch(text, numericValue);
    });

    activeRowIndex.value = matchIndex !== -1 ? matchIndex : null;
  }

  const tableId = useId();

  const { registerTableRollCallback, unregisterTableRollCallback } =
    useDiceRollerState();

  onMounted(() => {
    registerTableRollCallback(tableId, handleTableRoll);
  });

  onUnmounted(() => {
    unregisterTableRollCallback(tableId);
  });

  const TableHeaderContext = defineComponent({
    props: { tableId: { type: String, required: true } },
    setup(cProps, { slots }) {
      provide('dice-roller:table-id', cProps.tableId);

      return () => slots.default?.();
    },
  });

  const columnHelper = createColumnHelper<TableRowData>();

  const columns = computed<ColumnDef<TableRowData>[]>(() => {
    if (colCount.value === 0) {
      return [];
    }

    return Array.from({ length: colCount.value }, (_, columnIndex) =>
      columnHelper.display({
        id: `c${columnIndex}`,
        header: () => {
          const headerValue = labels.value[columnIndex] || [];
          const contentNode = h(MarkupContent, { content: headerValue });

          if (columnIndex === 0) {
            return h(TableHeaderContext, { tableId }, () => contentNode);
          }

          return contentNode;
        },
        cell: (ctx) => {
          const cellContent = ctx.row.original.cells[columnIndex] || [];

          return h(MarkupContent, { content: cellContent });
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
    return colStyles.value[index] || '';
  }
</script>

<template>
  <NodeViewWrapper class="my-4">
    <div
      class="w-full overflow-x-auto rounded-lg border border-default bg-muted"
    >
      <table class="min-w-full border-collapse">
        <caption
          v-if="caption.length > 0"
          class="py-2 text-sm font-medium text-highlighted"
        >
          <MarkupContent :content="caption" />
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
            :class="[
              'divide-x divide-default transition-colors',
              row.original.index === activeRowIndex ? 'bg-success/10' : '',
            ]"
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
  </NodeViewWrapper>
</template>
