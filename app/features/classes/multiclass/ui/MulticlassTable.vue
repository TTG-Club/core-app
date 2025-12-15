<script setup lang="ts">
  import { computed, h, ref } from 'vue';
  import type { Cell, ColumnDef } from '@tanstack/vue-table';
  import {
    FlexRender,
    getCoreRowModel,
    useVueTable,
  } from '@tanstack/vue-table';
  import { useDebounceFn } from '@vueuse/core';
  import { maxBy, omit, orderBy } from 'lodash-es';
  import { ULink } from '#components';
  import { LEVELS } from '~/shared/consts';
  import type { Level } from '~/shared/types';
  import type { ClassFeature } from '~classes/types';
  import type { MulticlassData } from '../types';

  const { data } = defineProps<{
    data: MulticlassData;
  }>();

  interface MulticlassTableRow {
    level: Level;
    proficiencyBonus: number;
    class1Features: Array<ClassFeature>;
    class2Features: Array<ClassFeature>;
    class1Data?: Record<string, string>;
    class2Data?: Record<string, string>;
  }

  interface HoverCell {
    rowIndex: number;
    columnIndex: number;
  }

  const hoveredCell = ref<HoverCell | null>(null);

  const debouncedCellHover = useDebounceFn(
    (rowIndex: number, columnIndex: number) => {
      hoveredCell.value = { rowIndex, columnIndex };
    },
    10,
  );

  const debouncedCellLeave = useDebounceFn(() => {
    hoveredCell.value = null;
  }, 10);

  const { scrollToAnchor } = useAnchorScroll();

  const maxLevel = computed(() =>
    Math.max(data.class1.level, data.class2.level),
  );

  // Получение особенностей для класса
  function getClassFeatures(
    features: Array<ClassFeature>,
    level: Level,
  ): Array<ClassFeature> {
    const list: Array<ClassFeature> = [];

    for (const feature of features) {
      if (feature.level <= level) {
        list.push(omit(feature, 'scaling'));

        if (feature.scaling) {
          list.push(
            ...feature.scaling
              .filter((scale) => scale.level <= level)
              .map((scale) => ({
                key: feature.key,
                isSubclass: feature.isSubclass,
                ...scale,
              })),
          );
        }
      }
    }

    return orderBy(list, ['level'], ['asc']).filter((f) => f.level === level);
  }

  function getScalingValueForLevel(
    level: Level,
    scalingArray: Array<{ level: number; value: string }> | undefined,
  ): string {
    if (!scalingArray?.length) return '—';

    const found = maxBy(
      scalingArray.filter((s) => s.level <= level),
      'level',
    );

    return found?.value ?? '—';
  }

  const tableData = computed(() => {
    return LEVELS.filter((level) => level <= maxLevel.value).map((level) => {
      const row: MulticlassTableRow = {
        level,
        proficiencyBonus: Math.floor((level - 1) / 4) + 2,
        class1Features: [],
        class2Features: [],
        class1Data: {},
        class2Data: {},
      };

      // Особенности класса 1
      if (level <= data.class1.level) {
        row.class1Features = getClassFeatures(
          data.class1.detail.features,
          level,
        );

        // Данные таблицы класса 1
        if (data.class1.detail.table) {
          data.class1.detail.table.forEach((tableColumn) => {
            row.class1Data![tableColumn.name] = getScalingValueForLevel(
              level,
              tableColumn.scaling,
            );
          });
        }
      }

      // Особенности класса 2
      if (level <= data.class2.level) {
        row.class2Features = getClassFeatures(
          data.class2.detail.features,
          level,
        );

        // Данные таблицы класса 2
        if (data.class2.detail.table) {
          data.class2.detail.table.forEach((tableColumn) => {
            row.class2Data![tableColumn.name] = getScalingValueForLevel(
              level,
              tableColumn.scaling,
            );
          });
        }
      }

      return row;
    });
  });

  const class1Name = computed(() => {
    if (data.class1.subclassUrl && data.class1.detail.parent) {
      return `${data.class1.detail.parent.name.rus} / ${data.class1.detail.name.rus}`;
    }

    return data.class1.detail.name.rus;
  });

  const class2Name = computed(() => {
    if (data.class2.subclassUrl && data.class2.detail.parent) {
      return `${data.class2.detail.parent.name.rus} / ${data.class2.detail.name.rus}`;
    }

    return data.class2.detail.name.rus;
  });

  const tableColumns = computed<ColumnDef<MulticlassTableRow>[]>(() => {
    const baseColumns: ColumnDef<MulticlassTableRow>[] = [
      {
        accessorKey: 'level',
        header: 'Ур.',
        cell: ({ row }) => row.original.level,
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      },
      {
        accessorKey: 'proficiencyBonus',
        header: 'БМ',
        cell: ({ row }) => `+${row.original.proficiencyBonus}`,
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      },
      {
        accessorKey: 'class1Features',
        header: () => h('span', { class: 'text-xs' }, class1Name.value),
        cell: ({ row }) => {
          const features = row.original.class1Features;

          if (!features || features.length === 0) {
            return row.original.level <= data.class1.level ? '—' : '';
          }

          const featureLinks = features.map((feature, index) => {
            const link = h(
              ULink,
              {
                href: `#${feature.key}`,
                replace: true,
                class: [
                  feature.isSubclass ? 'text-success hover:text-success' : '',
                  'transition-colors duration-100',
                ],
                onClick: withModifiers(
                  () => scrollToAnchor(feature.key),
                  ['left', 'exact', 'prevent'],
                ),
              },
              {
                default: () => feature.name,
              },
            );

            return index < features.length - 1 ? [link, h('span', ', ')] : link;
          });

          return h('span', featureLinks.flat());
        },
        meta: {
          class: {
            th: 'text-left min-w-48',
            td: 'text-left min-w-48',
          },
        },
      },
      {
        accessorKey: 'class2Features',
        header: () => h('span', { class: 'text-xs' }, class2Name.value),
        cell: ({ row }) => {
          const features = row.original.class2Features;

          if (!features || features.length === 0) {
            return row.original.level <= data.class2.level ? '—' : '';
          }

          const featureLinks = features.map((feature, index) => {
            const link = h(
              ULink,
              {
                href: `#${feature.key}`,
                replace: true,
                class: [
                  feature.isSubclass ? 'text-success hover:text-success' : '',
                  'transition-colors duration-100',
                ],
                onClick: withModifiers(
                  () => scrollToAnchor(feature.key),
                  ['left', 'exact', 'prevent'],
                ),
              },
              {
                default: () => feature.name,
              },
            );

            return index < features.length - 1 ? [link, h('span', ', ')] : link;
          });

          return h('span', featureLinks.flat());
        },
        meta: {
          class: {
            th: 'text-left min-w-48',
            td: 'text-left min-w-48',
          },
        },
      },
    ];

    return baseColumns;
  });

  const table = useVueTable({
    get data() {
      return tableData.value;
    },
    get columns() {
      return tableColumns.value;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  function getCellClass(
    cell: Cell<MulticlassTableRow, unknown>,
    rowIndex: number,
    columnIndex: number,
  ): string {
    const baseClass =
      'py-1 px-2 text-xs text-default transition-colors duration-100';

    const metaClass = cell.column.columnDef.meta?.class?.td || '';

    let hoverClass = '';

    if (hoveredCell.value) {
      const { rowIndex: hoveredRow, columnIndex: hoveredColumn } =
        hoveredCell.value;

      if (rowIndex === hoveredRow && columnIndex === hoveredColumn) {
        hoverClass = 'bg-accented/60';
      } else if (rowIndex === hoveredRow || columnIndex === hoveredColumn) {
        hoverClass = 'bg-accented/40';
      }
    }

    return `${baseClass} ${metaClass} ${hoverClass}`;
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="text-sm text-secondary">
      Максимальный уровень: {{ maxLevel }}
    </div>

    <div
      class="w-full overflow-x-auto rounded-lg border border-default bg-muted"
    >
      <table class="min-w-full border-collapse">
        <thead class="bg-elevated">
          <tr>
            <th
              v-for="header in table.getHeaderGroups()[0]?.headers || []"
              :key="header.id"
              :class="[
                'border-b border-default p-2 text-center text-xs text-highlighted',
                header.column.columnDef.meta?.class?.th || '',
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
            v-for="(row, rowIndex) in table.getRowModel().rows"
            :key="row.id"
            class="divide-x divide-default"
          >
            <td
              v-for="(cell, columnIndex) in row.getVisibleCells()"
              :key="cell.id"
              :class="getCellClass(cell, rowIndex, columnIndex)"
              @mouseenter="debouncedCellHover(rowIndex, columnIndex)"
              @mouseleave="debouncedCellLeave"
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
  </div>
</template>
