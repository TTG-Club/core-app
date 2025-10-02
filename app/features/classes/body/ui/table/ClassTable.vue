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
  import { maxBy, range } from 'lodash-es';
  import { useDndMechanics } from './useDndMechanics';
  import { SPELL_LEVELS_COUNT } from './const';
  import { ULink } from '#components';

  const props =
    defineProps<
      Pick<ClassDetailResponse, 'table' | 'casterType' | 'features'>
    >();

  interface ClassTableRow {
    level: number;
    proficiencyBonus: number;
    features: Array<ClassFeature>;

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

  // Инициализация D&D механик
  const dndMechanics = useDndMechanics({
    casterType: props.casterType,
  });

  // Функция получения масштабируемых значений
  function getScalingValueForLevel(
    level: number,
    scalingArray: Array<{ level: number; value: string }> | undefined,
  ): string {
    if (!scalingArray?.length) return '—';

    try {
      const found = maxBy(
        scalingArray.filter((s) => s.level <= level),
        'level',
      );

      return found?.value ?? '—';
    } catch (error) {
      console.error('Error in getScalingValueForLevel:', error);

      return '—';
    }
  }

  // Данные таблицы
  const tableData = computed(() => {
    const levels = range(1, 21);

    return levels.map((level) => {
      try {
        const row: ClassTableRow = {
          level,
          proficiencyBonus: dndMechanics.getProficiencyBonus(level),
          features: props.features?.filter((f) => f.level === level) || [],
        };

        // Добавление столбцов из таблицы класса
        if (props.table && Array.isArray(props.table)) {
          props.table.forEach((tableColumn) => {
            row[tableColumn.name] = getScalingValueForLevel(
              level,
              tableColumn.scaling,
            );
          });
        }

        // Добавление ячеек заклинаний
        if (props.casterType !== CasterType.NONE) {
          const spellcastingData = dndMechanics.getSpellcastingData(level);

          // Добавление ячеек заклинаний 1-9 уровня
          for (const spellLevel of range(1, SPELL_LEVELS_COUNT + 1)) {
            const slotCount = spellcastingData.spellSlots[spellLevel - 1];

            row[`spell${spellLevel}`] = (slotCount || 0) > 0 ? slotCount : '—';
          }
        }

        return row;
      } catch (error) {
        console.error(`Error processing level ${level}:`, error);

        // Возвращаем базовую строку в случае ошибки
        return {
          level,
          proficiencyBonus: Math.ceil(level / 4) + 1, // Fallback расчет
          features: [],
        };
      }
    });
  });

  // Столбцы таблицы
  const tableColumns = computed<ColumnDef<ClassTableRow>[]>(() => {
    try {
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
            const features = row.original.features as Array<ClassFeature>;

            if (!features || features.length === 0) {
              return '—';
            }

            // Создаем массив VNode для ссылок
            const featureLinks = features.map((feature, index) => {
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

              // Добавляем разделитель после каждой ссылки кроме последней
              return index < features.length - 1
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

      // Добавление кастомных столбцов класса из API
      if (props.table && Array.isArray(props.table)) {
        props.table.forEach((tableColumn) => {
          baseColumns.push({
            accessorKey: tableColumn.name,
            header: tableColumn.name,
            cell: ({ row }) => row.original[tableColumn.name] ?? '—',
            meta: {
              class: {
                th: 'w-28 text-center',
                td: 'w-28 text-center',
              },
            },
          });
        });
      }

      // Добавление столбцов ячеек заклинаний только для заклинателей
      if (props.casterType !== CasterType.NONE) {
        baseColumns.push({
          id: 'spellSlots',
          header: 'Ячейки заклинаний',
          columns: range(1, SPELL_LEVELS_COUNT + 1).map((level) => ({
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

      return baseColumns;
    } catch (error) {
      console.error('Error creating table columns:', error);

      // Возвращаем минимальный набор столбцов в случае ошибки
      return [
        {
          accessorKey: 'level',
          header: 'Ур.',
          cell: ({ row }) => row.original.level,
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
          header: 'Способности',
          cell: () => '—',
        },
      ];
    }
  });

  // TanStack Table
  const table = useVueTable({
    get data() {
      return tableData.value;
    },
    get columns() {
      return tableColumns.value;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  // Функции для rowspan логики
  function shouldShowHeader(header: Header<ClassTableRow, unknown>): boolean {
    const hasSpellSlots = props.casterType !== CasterType.NONE;

    if (!hasSpellSlots) {
      return true; // Без групп показываем все заголовки
    }

    // Используем логику из обсуждения TanStack Table
    const columnRelativeDepth = header.depth - header.column.depth;

    return !(
      !header.isPlaceholder &&
      columnRelativeDepth > 1 &&
      header.id === header.column.id
    );
  }

  function getRowSpan(header: Header<ClassTableRow, unknown>): number {
    const hasSpellSlots = props.casterType !== CasterType.NONE;

    // Если нет заклинаний, все заголовки имеют rowspan 1
    if (!hasSpellSlots) {
      return 1;
    }

    // Логика из обсуждения TanStack Table
    let rowSpan = 1;

    if (header.isPlaceholder) {
      const leafs = header.getLeafHeaders();

      // Безопасная проверка на существование последнего элемента
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

    // Применяем кастомные классы из meta
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

    // Добавляем классы для hover эффекта
    let hoverClass = '';

    if (hoveredCell.value) {
      const { rowIndex: hoveredRow, columnIndex: hoveredColumn } =
        hoveredCell.value;

      if (rowIndex === hoveredRow && columnIndex === hoveredColumn) {
        hoverClass = 'bg-elevated'; // Текущая ячейка
      } else if (rowIndex === hoveredRow || columnIndex === hoveredColumn) {
        hoverClass = 'bg-elevated/60'; // Строка или столбец
      }
    }

    return `${baseClass} ${metaClass} ${hoverClass}`;
  }
</script>

<template>
  <div class="w-full overflow-x-auto rounded border border-default">
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
