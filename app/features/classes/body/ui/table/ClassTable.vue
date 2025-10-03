<script setup lang="ts">
  import { computed, h, ref } from 'vue';
  import type { Cell, ColumnDef, Header } from '@tanstack/vue-table';
  import {
    FlexRender,
    getCoreRowModel,
    useVueTable,
  } from '@tanstack/vue-table';
  import { useDebounceFn } from '@vueuse/core';
  import {
    CasterType,
    type ClassDetailResponse,
    type ClassFeature,
  } from '~classes/types';
  import { maxBy, omit, orderBy, range } from 'lodash-es';
  import { useDndMechanics } from './useDndMechanics';
  import { ULink } from '#components';
  import { LEVELS } from '~/shared/consts';
  import type { Level } from '~/shared/types';
  import {
    PACT_CASTER_SPELL_SLOTS_COUNT,
    PACT_CASTER_SPELL_SLOTS_LEVEL,
  } from './const';

  const props =
    defineProps<
      Pick<ClassDetailResponse, 'table' | 'casterType' | 'features'>
    >();

  interface ClassTableRow {
    level: Level;
    proficiencyBonus: number;
    features: Array<ClassFeature>;
    pactSlotsCount?: number;
    pactSlotsLevel?: number;

    [key: string]: string | number | Array<ClassFeature> | undefined;
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

  const {
    spellSlots,
    isSpellcaster,
    isPactSpellcaster,
    isRegularSpellcaster,
    getProficiencyBonus,
  } = useDndMechanics({
    casterType: props.casterType,
  });

  const features = computed(() => {
    const list: Array<ClassFeature> = [];

    for (const feature of props.features) {
      list.push(omit(feature, 'scaling'));

      if (feature.scaling) {
        list.push(
          ...feature.scaling.map((scale) => ({
            key: feature.key,
            isSubclass: feature.isSubclass,
            ...scale,
          })),
        );
      }
    }

    return orderBy(list, ['level'], ['asc']);
  });

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

  const tableData = computed(() => orderBy(LEVELS.map(getLevelData), 'level'));

  function getLevelData(level: Level) {
    const row: ClassTableRow = {
      level,
      proficiencyBonus: getProficiencyBonus(level),
      features: features.value.filter((f) => f.level === level) || [],
    };

    if (props.table && Array.isArray(props.table)) {
      props.table.forEach((tableColumn) => {
        row[tableColumn.name] = getScalingValueForLevel(
          level,
          tableColumn.scaling,
        );
      });
    }

    if (!isSpellcaster.value) {
      return row;
    }

    if (isPactSpellcaster.value) {
      row.pactSlotsCount = PACT_CASTER_SPELL_SLOTS_COUNT[level];
      row.pactSlotsLevel = PACT_CASTER_SPELL_SLOTS_LEVEL[level];
    } else {
      const levelSpellSlots = spellSlots.value![level];

      levelSpellSlots.forEach((slotCount, slotIndex) => {
        row[`spell${slotIndex + 1}`] = slotCount > 0 ? slotCount : '—';
      });
    }

    return row;
  }

  const tableColumns = computed<ColumnDef<ClassTableRow>[]>(() => {
    const baseColumns: ColumnDef<ClassTableRow>[] = [
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
        accessorKey: 'features',
        header: 'Умения класса',
        cell: ({ row }) => {
          const featuresInLevel = row.original.features;

          if (!featuresInLevel || featuresInLevel.length === 0) {
            return '—';
          }

          const featureLinks = featuresInLevel.map((feature, index) => {
            const link = h(
              ULink,
              {
                href: `#${feature.key}`,
                replace: true,
                class: [
                  feature.isSubclass
                    ? 'text-success hover:text-success'
                    : 'text-primary hover:text-primary',
                  'transition-colors duration-100',
                ],
              },
              {
                default: () => feature.name,
              },
            );

            return index < featuresInLevel.length - 1
              ? [link, h('span', ', ')]
              : link;
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

    if (props.table && Array.isArray(props.table)) {
      props.table.forEach((tableColumn) => {
        baseColumns.push({
          accessorKey: tableColumn.name,
          header: tableColumn.name,
          cell: ({ row }) => row.original[tableColumn.name] ?? '—',
          meta: {
            class: {
              th: 'max-w-28 text-center',
              td: 'max-w-28 text-center',
            },
          },
        });
      });
    }

    if (!isSpellcaster.value) {
      return baseColumns;
    }

    if (isRegularSpellcaster.value) {
      let spellSlotsCount = 0;

      if (props.casterType === CasterType.FULL) {
        spellSlotsCount = 9;
      } else if (props.casterType === CasterType.HALF) {
        spellSlotsCount = 5;
      } else if (props.casterType === CasterType.THIRD) {
        spellSlotsCount = 4;
      }

      if (!spellSlotsCount) {
        return baseColumns;
      }

      baseColumns.push({
        id: 'spellSlots',
        header: 'Ячейки заклинаний',
        columns: range(1, spellSlotsCount + 1).map((level) => ({
          accessorKey: `spell${level}`,
          header: `${level}`,
          cell: ({ row }) => row.original[`spell${level}`] ?? '—',
          meta: {
            class: {
              th: 'w-8 text-center',
              td: 'w-8 text-center',
            },
          },
        })),
      });
    }

    if (isPactSpellcaster.value) {
      baseColumns.push({
        id: 'pactSlotsCount',
        header: 'Кол-во ячеек',
        cell: ({ row }) => row.original.pactSlotsCount ?? '—',
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      });

      baseColumns.push({
        id: 'pactSlotsLevel',
        header: 'Ур. ячейки',
        cell: ({ row }) => row.original.pactSlotsLevel ?? '—',
        meta: {
          class: {
            th: 'w-8 text-center',
            td: 'w-8 text-center',
          },
        },
      });
    }

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

  function shouldShowHeader(header: Header<ClassTableRow, unknown>): boolean {
    const hasSpellSlots = props.casterType !== CasterType.NONE;

    if (!hasSpellSlots) {
      return true;
    }

    const columnRelativeDepth = header.depth - header.column.depth;

    return !(
      !header.isPlaceholder &&
      columnRelativeDepth > 1 &&
      header.id === header.column.id
    );
  }

  function getRowSpan(header: Header<ClassTableRow, unknown>): number {
    const hasSpellSlots = props.casterType !== CasterType.NONE;

    if (!hasSpellSlots) {
      return 1;
    }

    let rowSpan = 1;

    if (header.isPlaceholder) {
      const leafs = header.getLeafHeaders();

      if (leafs.length > 0) {
        const lastLeaf = leafs[leafs.length - 1];

        if (lastLeaf) {
          rowSpan = lastLeaf.depth - header.depth;
        }
      }
    }

    return rowSpan;
  }

  function getHeaderClass(header: Header<ClassTableRow, unknown>): string {
    const baseClass =
      'p-2 text-xs border-b border-default text-center text-highlighted';

    const metaClass = header.column.columnDef.meta?.class?.th || '';

    return `${baseClass} ${metaClass}`;
  }

  function getCellClass(
    cell: Cell<ClassTableRow, unknown>,
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
        hoverClass = 'bg-elevated';
      } else if (rowIndex === hoveredRow || columnIndex === hoveredColumn) {
        hoverClass = 'bg-elevated/60';
      }
    }

    return `${baseClass} ${metaClass} ${hoverClass}`;
  }
</script>

<template>
  <div class="w-full overflow-x-auto rounded-lg border border-default">
    <table class="min-w-full border-collapse">
      <thead class="bg-elevated/50">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            v-show="shouldShowHeader(header)"
            :key="header.id"
            :colspan="header.colSpan"
            :rowspan="getRowSpan(header)"
            :class="getHeaderClass(header)"
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
</template>
